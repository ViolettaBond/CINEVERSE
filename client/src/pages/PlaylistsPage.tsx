import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ConfirmDialog, Modal } from '../components/Modal'
import Poster from '../components/Poster'
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews'
import { useToast } from '../context/ToastContext'
import { useFetch } from '../hooks/useFetch'
import { api, getErrorMessage } from '../services/api'
import { buttonPrimary, buttonSecondary, errorTextClass, inputClass, labelClass } from '../styles'
import type { Collection } from '../types'
import { pluralize } from '../utils/format'
import { validateCollection, type CollectionValues, type FormErrors } from '../utils/validation'

const emptyForm: CollectionValues = { name: '', description: '', coverUrl: '' }

export function CollectionForm({ initial, submitLabel, onSubmit, onCancel }: {
  initial: CollectionValues
  submitLabel: string
  onSubmit: (values: CollectionValues) => Promise<void>
  onCancel: () => void
}) {
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState<FormErrors<CollectionValues>>({})
  const [busy, setBusy] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const found = validateCollection(values)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    setBusy(true)
    try {
      await onSubmit(values)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-3">
      <div>
        <label htmlFor="c-name" className={labelClass}>Название</label>
        <input id="c-name" className={inputClass} value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} />
        {errors.name && <p className={errorTextClass}>{errors.name}</p>}
      </div>
      <div>
        <label htmlFor="c-desc" className={labelClass}>Описание</label>
        <textarea id="c-desc" rows={3} className={inputClass} value={values.description} onChange={(e) => setValues({ ...values, description: e.target.value })} />
        {errors.description && <p className={errorTextClass}>{errors.description}</p>}
      </div>
      <div>
        <label htmlFor="c-cover" className={labelClass}>Ссылка на обложку (необязательно)</label>
        <input id="c-cover" className={inputClass} placeholder="https://…" value={values.coverUrl} onChange={(e) => setValues({ ...values, coverUrl: e.target.value })} />
        {errors.coverUrl && <p className={errorTextClass}>{errors.coverUrl}</p>}
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className={buttonSecondary}>Отмена</button>
        <button type="submit" disabled={busy} className={buttonPrimary}>{submitLabel}</button>
      </div>
    </form>
  )
}

export default function PlaylistsPage() {
  const toast = useToast()
  const { data, loading, error, reload } = useFetch(() => api.get<Collection[]>('/collections').then((r) => r.data), [])
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Collection | null>(null)
  const [deleting, setDeleting] = useState<Collection | null>(null)

  const toBody = (v: CollectionValues) => ({ name: v.name.trim(), description: v.description.trim(), coverUrl: v.coverUrl.trim() })

  const create = async (values: CollectionValues) => {
    try {
      await api.post('/collections', toBody(values))
      toast.success('Подборка создана')
      setCreating(false)
      reload()
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  const update = async (values: CollectionValues) => {
    if (!editing) return
    try {
      await api.put(`/collections/${editing.id}`, toBody(values))
      toast.success('Подборка обновлена')
      setEditing(null)
      reload()
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  const remove = async () => {
    if (!deleting) return
    try {
      await api.delete(`/collections/${deleting.id}`)
      toast.success('Подборка удалена')
      setDeleting(null)
      reload()
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Мои подборки</h1>
        <button onClick={() => setCreating(true)} className={buttonPrimary}>Создать подборку</button>
      </div>

      <div className="mt-6">
        {loading && <LoadingState />}
        {!loading && error && <ErrorState text={error} onRetry={reload} />}
        {!loading && !error && data?.length === 0 && (
          <EmptyState title="Подборок пока нет" text="Соберите фильмы по настроению: «Для вечера», «Любимая фантастика»…" />
        )}
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.map((c) => (
            <li key={c.id} className="overflow-hidden rounded-xl bg-card">
              <Link to={`/playlists/${c.id}`}>
                <Poster title={c.name} url={c.cover_url} className="h-36 w-full" />
              </Link>
              <div className="p-4">
                <Link to={`/playlists/${c.id}`} className="font-medium hover:text-accent-soft">{c.name}</Link>
                <p className="text-xs text-muted">{c.movies_count} {pluralize(c.movies_count, ['фильм', 'фильма', 'фильмов'])}</p>
                {c.description && <p className="mt-2 line-clamp-2 text-sm text-muted">{c.description}</p>}
                <div className="mt-3 flex gap-4 text-sm">
                  <button onClick={() => setEditing(c)} className="text-accent-soft hover:underline">Изменить</button>
                  <button onClick={() => setDeleting(c)} className="text-red-400 hover:underline">Удалить</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <Modal open={creating} title="Новая подборка" onClose={() => setCreating(false)}>
        <CollectionForm initial={emptyForm} submitLabel="Создать" onSubmit={create} onCancel={() => setCreating(false)} />
      </Modal>
      <Modal open={editing !== null} title="Редактирование подборки" onClose={() => setEditing(null)}>
        {editing && (
          <CollectionForm
            initial={{ name: editing.name, description: editing.description ?? '', coverUrl: editing.cover_url ?? '' }}
            submitLabel="Сохранить"
            onSubmit={update}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
      <ConfirmDialog open={deleting !== null} title="Удалить подборку?" message={`Подборка «${deleting?.name ?? ''}» будет удалена. Сами фильмы останутся в каталоге.`} confirmLabel="Удалить" danger onConfirm={() => void remove()} onCancel={() => setDeleting(null)} />
    </div>
  )
}
