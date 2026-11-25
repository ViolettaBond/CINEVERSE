import { useState, type FormEvent } from 'react'
import { ConfirmDialog } from '../../components/Modal'
import { ErrorState, LoadingState } from '../../components/StateViews'
import { useToast } from '../../context/ToastContext'
import { useFetch } from '../../hooks/useFetch'
import { api, getErrorMessage } from '../../services/api'
import { buttonPrimary, inputClass } from '../../styles'
import type { Genre } from '../../types'

export default function AdminGenres() {
  const toast = useToast()
  const { data, loading, error, reload } = useFetch(() => api.get<Genre[]>('/genres').then((r) => r.data), [])
  const [name, setName] = useState('')
  const [editing, setEditing] = useState<Genre | null>(null)
  const [editName, setEditName] = useState('')
  const [deleting, setDeleting] = useState<Genre | null>(null)

  const run = async (action: () => Promise<unknown>, success: string) => {
    try {
      await action()
      toast.success(success)
      reload()
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  const add = (event: FormEvent) => {
    event.preventDefault()
    if (name.trim().length < 2) return toast.error('Название жанра: не менее 2 символов')
    void run(() => api.post('/genres', { name: name.trim() }), 'Жанр добавлен').then(() => setName(''))
  }

  const save = () => {
    if (!editing) return
    if (editName.trim().length < 2) return toast.error('Название жанра: не менее 2 символов')
    void run(() => api.put(`/genres/${editing.id}`, { name: editName.trim() }), 'Жанр изменён').then(() => setEditing(null))
  }

  if (loading) return <LoadingState />
  if (error) return <ErrorState text={error} onRetry={reload} />
  return (
    <div>
      <form onSubmit={add} className="flex gap-3">
        <input aria-label="Новый жанр" className={inputClass} placeholder="Новый жанр" value={name} onChange={(e) => setName(e.target.value)} />
        <button className={buttonPrimary}>Добавить</button>
      </form>
      <ul className="mt-4 divide-y divide-white/5 rounded-xl bg-card">
        {data?.map((g) => (
          <li key={g.id} className="flex items-center justify-between gap-3 px-4 py-3">
            {editing?.id === g.id ? (
              <>
                <input aria-label="Название жанра" className={inputClass} value={editName} onChange={(e) => setEditName(e.target.value)} />
                <div className="flex gap-3 text-sm">
                  <button onClick={save} className="text-accent-soft hover:underline">Сохранить</button>
                  <button onClick={() => setEditing(null)} className="text-muted hover:underline">Отмена</button>
                </div>
              </>
            ) : (
              <>
                <span>{g.name}</span>
                <div className="flex gap-3 text-sm">
                  <button onClick={() => { setEditing(g); setEditName(g.name) }} className="text-accent-soft hover:underline">Изменить</button>
                  <button onClick={() => setDeleting(g)} className="text-red-400 hover:underline">Удалить</button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
      <ConfirmDialog open={deleting !== null} title="Удалить жанр?" message={`Жанр «${deleting?.name ?? ''}» будет убран у всех фильмов.`} confirmLabel="Удалить" danger onConfirm={() => { const g = deleting; setDeleting(null); if (g) void run(() => api.delete(`/genres/${g.id}`), 'Жанр удалён') }} onCancel={() => setDeleting(null)} />
    </div>
  )
}
