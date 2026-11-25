import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ConfirmDialog, Modal } from '../components/Modal'
import MovieGrid from '../components/MovieGrid'
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews'
import { useToast } from '../context/ToastContext'
import { useFetch } from '../hooks/useFetch'
import { api, getErrorMessage } from '../services/api'
import { buttonPrimary, buttonSecondary, inputClass } from '../styles'
import type { CollectionDetails, Movie, Paginated } from '../types'

function AddMovieModal({ collectionId, existing, onClose, onAdded }: { collectionId: number; existing: Set<number>; onClose: () => void; onAdded: () => void }) {
  const toast = useToast()
  const [q, setQ] = useState('')
  const results = useFetch(
    () => (q.trim() ? api.get<Paginated<Movie>>('/movies', { params: { q: q.trim(), limit: 8 } }).then((r) => r.data.items) : Promise.resolve([] as Movie[])),
    [q],
  )

  const add = async (movieId: number) => {
    try {
      await api.post(`/collections/${collectionId}/movies`, { movieId })
      toast.success('Фильм добавлен в подборку')
      onAdded()
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  return (
    <Modal open title="Добавить фильм" onClose={onClose}>
      <input aria-label="Поиск фильма" autoFocus className={inputClass} placeholder="Название фильма" value={q} onChange={(e) => setQ(e.target.value)} />
      <ul className="mt-3 space-y-2">
        {results.data?.map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-3 rounded-lg bg-surface px-3 py-2 text-sm">
            <span>{m.title} <span className="text-muted">({m.release_year})</span></span>
            {existing.has(m.id) ? <span className="text-xs text-muted">Уже в подборке</span> : (
              <button onClick={() => void add(m.id)} className="text-accent-soft hover:underline">Добавить</button>
            )}
          </li>
        ))}
        {q.trim() && !results.loading && results.data?.length === 0 && <li className="text-sm text-muted">Ничего не найдено</li>}
      </ul>
    </Modal>
  )
}

export default function PlaylistDetailPage() {
  const { id } = useParams()
  const collectionId = Number(id)
  const navigate = useNavigate()
  const toast = useToast()
  const { data, loading, error, reload } = useFetch(() => api.get<CollectionDetails>(`/collections/${collectionId}`).then((r) => r.data), [collectionId])
  const [adding, setAdding] = useState(false)
  const [removeId, setRemoveId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  if (loading) return <LoadingState />
  if (error || !data) return <ErrorState text={error || 'Подборка не найдена'} onRetry={reload} />

  const removeMovie = async () => {
    if (removeId === null) return
    try {
      await api.delete(`/collections/${collectionId}/movies/${removeId}`)
      toast.success('Фильм убран из подборки')
      setRemoveId(null)
      reload()
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  const removeCollection = async () => {
    try {
      await api.delete(`/collections/${collectionId}`)
      toast.success('Подборка удалена')
      navigate('/playlists')
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  return (
    <div>
      <Link to="/playlists" className="text-sm text-accent-soft hover:underline">← Все подборки</Link>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{data.name}</h1>
          {data.description && <p className="mt-1 max-w-2xl text-sm text-muted">{data.description}</p>}
        </div>
        <div className="flex gap-3">
          <button onClick={() => setAdding(true)} className={buttonPrimary}>Добавить фильм</button>
          <button onClick={() => setDeleting(true)} className={buttonSecondary}>Удалить подборку</button>
        </div>
      </div>

      <div className="mt-6">
        {data.movies.length === 0 ? (
          <EmptyState title="В подборке пока нет фильмов" text="Нажмите «Добавить фильм», чтобы найти первый." />
        ) : (
          <MovieGrid movies={data.movies} renderActions={(m) => <button onClick={() => setRemoveId(m.id)} className="text-xs text-red-400 hover:underline">Убрать</button>} />
        )}
      </div>

      {adding && <AddMovieModal collectionId={collectionId} existing={new Set(data.movies.map((m) => m.id))} onClose={() => setAdding(false)} onAdded={reload} />}
      <ConfirmDialog open={removeId !== null} title="Убрать фильм из подборки?" message="Сам фильм останется в каталоге." confirmLabel="Убрать" danger onConfirm={() => void removeMovie()} onCancel={() => setRemoveId(null)} />
      <ConfirmDialog open={deleting} title="Удалить подборку?" message="Подборка будет удалена безвозвратно." confirmLabel="Удалить" danger onConfirm={() => void removeCollection()} onCancel={() => setDeleting(false)} />
    </div>
  )
}
