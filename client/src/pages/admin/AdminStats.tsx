import { ErrorState, LoadingState } from '../../components/StateViews'
import { useFetch } from '../../hooks/useFetch'
import { api } from '../../services/api'
import type { AdminStats as Stats } from '../../types'

export default function AdminStats() {
  const { data, loading, error, reload } = useFetch(() => api.get<Stats>('/admin/statistics').then((r) => r.data), [])
  if (loading) return <LoadingState />
  if (error || !data) return <ErrorState text={error} onRetry={reload} />

  const items: [string, number][] = [
    ['Пользователей', data.users], ['Фильмов', data.movies], ['Сериалов', data.series], ['Жанров', data.genres],
    ['Отзывов', data.reviews], ['Оценок', data.ratings], ['Подборок', data.collections],
  ]
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {items.map(([label, value]) => (
          <div key={label} className="rounded-xl bg-card p-4">
            <p className="text-2xl font-semibold text-accent-soft">{value}</p>
            <p className="text-sm text-muted">{label}</p>
          </div>
        ))}
      </div>
      <h3 className="mb-2 mt-6 font-semibold">Чаще всего в избранном</h3>
      {data.topFavorites.length === 0 ? <p className="text-sm text-muted">Пока нет данных.</p> : (
        <ol className="space-y-1 text-sm">
          {data.topFavorites.map((m) => <li key={m.id}>{m.title} — {m.favorites_count}</li>)}
        </ol>
      )}
    </div>
  )
}
