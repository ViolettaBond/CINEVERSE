import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ConfirmDialog } from '../components/Modal'
import MovieGrid from '../components/MovieGrid'
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews'
import { useLists } from '../context/ListsContext'
import { useToast } from '../context/ToastContext'
import { useFetch } from '../hooks/useFetch'
import { api, getErrorMessage } from '../services/api'
import { buttonSecondary, inputClass } from '../styles'
import type { Collection, ListName, Movie } from '../types'

type Tab = ListName | 'playlists'

const TABS: { id: Tab; label: string }[] = [
  { id: 'favorites', label: 'Избранное' },
  { id: 'watchlist', label: 'Посмотреть позже' },
  { id: 'watched', label: 'Просмотренное' },
  { id: 'playlists', label: 'Мои подборки' },
]

const EMPTY_TEXT: Record<ListName, string> = {
  favorites: 'Нажмите на сердечко на карточке фильма, чтобы добавить его сюда.',
  watchlist: 'Добавляйте фильмы, которые хотите посмотреть позже.',
  watched: 'Отмечайте просмотренные фильмы, чтобы вести историю.',
}

function MovieList({ list }: { list: ListName }) {
  const toast = useToast()
  const lists = useLists()
  const [q, setQ] = useState('')
  const [sort, setSort] = useState('added')
  const [order, setOrder] = useState('desc')
  const [removeId, setRemoveId] = useState<number | null>(null)

  const { data, loading, error, reload } = useFetch(
    () => api.get<Movie[]>(`/${list}`, { params: { q: q.trim() || undefined, sort, order } }).then((r) => r.data),
    [list, q, sort, order],
  )

  const remove = async () => {
    if (removeId === null) return
    try {
      await api.delete(`/${list}/${removeId}`)
      toast.success('Удалено из списка')
      setRemoveId(null)
      reload()
      void lists.refresh()
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  const markWatched = async (id: number) => {
    try {
      await api.post('/watched', { movieId: id })
      toast.success('Перемещено в «Просмотренное»')
      reload()
      void lists.refresh()
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  return (
    <div>
      <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <input aria-label="Поиск в списке" className={inputClass} placeholder="Поиск по моей коллекции" value={q} onChange={(e) => setQ(e.target.value)} />
        <select aria-label="Сортировка" className={inputClass} value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="added">По дате добавления</option>
          <option value="title">По названию</option>
          <option value="year">По году выхода</option>
        </select>
        <select aria-label="Порядок" className={inputClass} value={order} onChange={(e) => setOrder(e.target.value)}>
          <option value="desc">Сначала новые / Я→А</option>
          <option value="asc">Сначала старые / А→Я</option>
        </select>
      </div>

      {loading && <LoadingState />}
      {!loading && error && <ErrorState text={error} onRetry={reload} />}
      {!loading && !error && data?.length === 0 && (
        q ? <EmptyState title="Ничего не найдено" text="Измените запрос." /> : (
          <EmptyState title="Список пока пуст" text={EMPTY_TEXT[list]} action={<Link to="/catalog" className={buttonSecondary}>Перейти в каталог</Link>} />
        )
      )}
      {!loading && !error && data && data.length > 0 && (
        <MovieGrid
          movies={data}
          renderActions={(movie) => (
            <>
              {list === 'watchlist' && (
                <button onClick={() => void markWatched(movie.id)} className="text-xs text-accent-soft hover:underline">Просмотрено</button>
              )}
              <button onClick={() => setRemoveId(movie.id)} className="text-xs text-red-400 hover:underline">Удалить</button>
            </>
          )}
        />
      )}
      <ConfirmDialog open={removeId !== null} title="Убрать из списка?" message="Фильм будет удалён только из этого списка." confirmLabel="Убрать" danger onConfirm={() => void remove()} onCancel={() => setRemoveId(null)} />
    </div>
  )
}

function PlaylistsTab() {
  const { data, loading, error, reload } = useFetch(() => api.get<Collection[]>('/collections').then((r) => r.data), [])
  if (loading) return <LoadingState />
  if (error) return <ErrorState text={error} onRetry={reload} />
  return data && data.length > 0 ? (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((c) => (
        <li key={c.id}>
          <Link to={`/playlists/${c.id}`} className="block rounded-xl bg-card p-4 hover:ring-1 hover:ring-accent/50">
            <p className="font-medium">{c.name}</p>
            <p className="text-sm text-muted">Фильмов: {c.movies_count}</p>
          </Link>
        </li>
      ))}
    </ul>
  ) : (
    <EmptyState title="У вас пока нет подборок" action={<Link to="/playlists" className={buttonSecondary}>Создать подборку</Link>} />
  )
}

export default function CollectionPage() {
  const [tab, setTab] = useState<Tab>('favorites')

  return (
    <div>
      <h1 className="text-2xl font-semibold">Моя коллекция</h1>
      <div className="mt-4 flex gap-2 overflow-x-auto border-b border-white/10 pb-2" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm transition ${tab === t.id ? 'bg-accent text-bg' : 'text-muted hover:bg-card hover:text-text'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="mt-5">{tab === 'playlists' ? <PlaylistsTab /> : <MovieList key={tab} list={tab} />}</div>
    </div>
  )
}
