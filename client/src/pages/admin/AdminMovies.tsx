import { useState, type FormEvent } from 'react'
import { ConfirmDialog, Modal } from '../../components/Modal'
import Pagination from '../../components/Pagination'
import { EmptyState, ErrorState, LoadingState } from '../../components/StateViews'
import { useToast } from '../../context/ToastContext'
import { useFetch } from '../../hooks/useFetch'
import { api, getErrorMessage } from '../../services/api'
import { buttonPrimary, buttonSecondary, errorTextClass, inputClass, labelClass } from '../../styles'
import type { Genre, Movie, MovieDetails, Paginated } from '../../types'
import { typeLabel } from '../../utils/format'
import { validateMovieForm, type FormErrors, type MovieFormValues } from '../../utils/validation'

const emptyForm: MovieFormValues = {
  title: '', originalTitle: '', type: 'movie', releaseYear: '', duration: '', country: '', ageRating: '',
  director: '', writers: '', castList: '', description: '', posterUrl: '', backdropUrl: '', genreIds: [],
}

function fromDetails(m: MovieDetails): MovieFormValues {
  return {
    title: m.title, originalTitle: m.original_title ?? '', type: m.type, releaseYear: String(m.release_year),
    duration: m.duration ? String(m.duration) : '', country: m.country ?? '', ageRating: m.age_rating ?? '',
    director: m.director ?? '', writers: m.writers ?? '', castList: m.cast_list ?? '', description: m.description ?? '',
    posterUrl: m.poster_url ?? '', backdropUrl: m.backdrop_url ?? '', genreIds: m.genres.map((g) => g.id),
  }
}

function MovieForm({ initial, genres, onSubmit, onCancel }: { initial: MovieFormValues; genres: Genre[]; onSubmit: (v: MovieFormValues) => Promise<void>; onCancel: () => void }) {
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState<FormErrors<MovieFormValues>>({})
  const [busy, setBusy] = useState(false)

  const text = (key: Exclude<keyof MovieFormValues, 'genreIds' | 'type'>, label: string, type = 'text') => (
    <div>
      <label htmlFor={`m-${key}`} className={labelClass}>{label}</label>
      {key === 'description' ? (
        <textarea id={`m-${key}`} rows={3} className={inputClass} value={values[key]} onChange={(e) => setValues({ ...values, [key]: e.target.value })} />
      ) : (
        <input id={`m-${key}`} type={type} className={inputClass} value={values[key]} onChange={(e) => setValues({ ...values, [key]: e.target.value })} />
      )}
      {errors[key] && <p className={errorTextClass}>{errors[key]}</p>}
    </div>
  )

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const found = validateMovieForm(values)
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
      {text('title', 'Название')}
      {text('originalTitle', 'Оригинальное название')}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="m-type" className={labelClass}>Тип</label>
          <select id="m-type" className={inputClass} value={values.type} onChange={(e) => setValues({ ...values, type: e.target.value as 'movie' | 'series' })}>
            <option value="movie">Фильм</option>
            <option value="series">Сериал</option>
          </select>
        </div>
        {text('releaseYear', 'Год выпуска', 'number')}
        {text('duration', 'Длительность, мин', 'number')}
        {text('ageRating', 'Возраст (например, 16+)')}
      </div>
      {text('country', 'Страна')}
      {text('director', 'Режиссёр')}
      {text('writers', 'Сценаристы')}
      {text('castList', 'Актёры')}
      {text('description', 'Описание')}
      {text('posterUrl', 'Постер: ссылка https://… или путь /posters/имя.svg')}
      {text('backdropUrl', 'Баннер: ссылка https://… или путь /backdrops/имя.svg')}
      <fieldset>
        <legend className={labelClass}>Жанры</legend>
        <div className="flex flex-wrap gap-3">
          {genres.map((g) => (
            <label key={g.id} className="flex items-center gap-1.5 text-sm">
              <input type="checkbox" className="accent-[#A78BFA]" checked={values.genreIds.includes(g.id)} onChange={(e) => setValues({ ...values, genreIds: e.target.checked ? [...values.genreIds, g.id] : values.genreIds.filter((id) => id !== g.id) })} />
              {g.name}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className={buttonSecondary}>Отмена</button>
        <button type="submit" disabled={busy} className={buttonPrimary}>Сохранить</button>
      </div>
    </form>
  )
}

export default function AdminMovies() {
  const toast = useToast()
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const genres = useFetch(() => api.get<Genre[]>('/genres').then((r) => r.data), [])
  const movies = useFetch(() => api.get<Paginated<Movie>>('/movies', { params: { q: q.trim() || undefined, page, limit: 10 } }).then((r) => r.data), [q, page])
  const [form, setForm] = useState<{ id: number | null; values: MovieFormValues } | null>(null)
  const [deleting, setDeleting] = useState<Movie | null>(null)

  const toBody = (v: MovieFormValues) => ({
    title: v.title.trim(), originalTitle: v.originalTitle.trim(), type: v.type, releaseYear: Number(v.releaseYear),
    duration: v.duration ? Number(v.duration) : undefined, country: v.country.trim(), ageRating: v.ageRating.trim(),
    director: v.director.trim(), writers: v.writers.trim(), castList: v.castList.trim(), description: v.description.trim(),
    posterUrl: v.posterUrl.trim(), backdropUrl: v.backdropUrl.trim(), genreIds: v.genreIds,
  })

  const save = async (values: MovieFormValues) => {
    try {
      if (form?.id) await api.put(`/movies/${form.id}`, toBody(values))
      else await api.post('/movies', toBody(values))
      toast.success(form?.id ? 'Фильм обновлён' : 'Фильм добавлен')
      setForm(null)
      movies.reload()
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  const edit = async (id: number) => {
    try {
      const res = await api.get<MovieDetails>(`/movies/${id}`)
      setForm({ id, values: fromDetails(res.data) })
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  const remove = async () => {
    if (!deleting) return
    try {
      await api.delete(`/movies/${deleting.id}`)
      toast.success('Фильм удалён')
      setDeleting(null)
      movies.reload()
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <input aria-label="Поиск" className={`${inputClass} max-w-xs`} placeholder="Поиск по названию" value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} />
        <button onClick={() => setForm({ id: null, values: emptyForm })} className={buttonPrimary}>Добавить</button>
      </div>
      <div className="mt-4">
        {movies.loading && <LoadingState />}
        {!movies.loading && movies.error && <ErrorState text={movies.error} onRetry={movies.reload} />}
        {!movies.loading && movies.data?.items.length === 0 && <EmptyState title="Ничего не найдено" />}
        {movies.data && movies.data.items.length > 0 && (
          <div className="overflow-x-auto rounded-xl bg-card">
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-white/5">
                {movies.data.items.map((m) => (
                  <tr key={m.id}>
                    <td className="px-4 py-3">{m.title}<span className="ml-2 text-xs text-muted">{m.release_year} · {typeLabel(m.type)}</span></td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <button onClick={() => void edit(m.id)} className="mr-3 text-accent-soft hover:underline">Изменить</button>
                      <button onClick={() => setDeleting(m)} className="text-red-400 hover:underline">Удалить</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {movies.data && <Pagination page={movies.data.page} totalPages={movies.data.totalPages} onChange={setPage} />}
      </div>

      <Modal open={form !== null} title={form?.id ? 'Редактирование' : 'Новый фильм или сериал'} onClose={() => setForm(null)}>
        {form && <MovieForm initial={form.values} genres={genres.data ?? []} onSubmit={save} onCancel={() => setForm(null)} />}
      </Modal>
      <ConfirmDialog open={deleting !== null} title="Удалить из каталога?" message={`«${deleting?.title ?? ''}» исчезнет из каталога, списков, подборок и отзывов пользователей.`} confirmLabel="Удалить" danger onConfirm={() => void remove()} onCancel={() => setDeleting(null)} />
    </div>
  )
}
