import { useState } from 'react'
import { Modal } from '../components/Modal'
import ProfileEditForm from '../components/ProfileEditForm'
import { ErrorState, LoadingState } from '../components/StateViews'
import { useAuth } from '../context/AuthContext'
import { useFetch } from '../hooks/useFetch'
import { api } from '../services/api'
import { buttonSecondary } from '../styles'
import type { UserStats } from '../types'
import { formatDate, initials } from '../utils/format'

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-card p-4">
      <p className="text-2xl font-semibold text-accent-soft">{value}</p>
      <p className="text-sm text-muted">{label}</p>
    </div>
  )
}

export default function ProfilePage() {
  const { user } = useAuth()
  const stats = useFetch(() => api.get<UserStats>('/users/me/stats').then((r) => r.data), [])
  const [editing, setEditing] = useState(false)

  if (!user) return null
  return (
    <div>
      <h1 className="text-2xl font-semibold">Профиль</h1>

      <section className="mt-6 flex flex-col gap-5 rounded-2xl bg-card p-6 sm:flex-row sm:items-center">
        {user.avatar ? (
          <img src={user.avatar} alt="Аватар" className="h-24 w-24 rounded-full object-cover" />
        ) : (
          <span className="flex h-24 w-24 items-center justify-center rounded-full bg-accent/20 text-3xl font-semibold text-accent-soft">{initials(user.username)}</span>
        )}
        <div className="flex-1">
          <p className="text-xl font-semibold">{user.username}</p>
          <p className="text-sm text-muted">{user.email}</p>
          <p className="mt-1 text-sm text-muted">Дата регистрации: {formatDate(user.created_at)}</p>
        </div>
        <button onClick={() => setEditing(true)} className={buttonSecondary}>Редактировать</button>
      </section>

      {stats.loading && <LoadingState />}
      {!stats.loading && stats.error && <ErrorState text={stats.error} onRetry={stats.reload} />}
      {stats.data && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Просмотрено фильмов" value={stats.data.watchedMovies} />
            <Stat label="Просмотрено сериалов" value={stats.data.watchedSeries} />
            <Stat label="Отзывов" value={stats.data.reviewsCount} />
            <Stat label="Подборок" value={stats.data.collectionsCount} />
          </div>
          <section className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-card p-4">
              <p className="text-sm text-muted">Любимые жанры</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {stats.data.favoriteGenres.length > 0 ? (
                  stats.data.favoriteGenres.map((g) => <span key={g} className="rounded-full bg-accent/15 px-3 py-1 text-sm text-accent-soft">{g}</span>)
                ) : (
                  <span className="text-sm text-muted">Появятся, когда вы добавите фильмы в избранное или отметите просмотренными.</span>
                )}
              </div>
            </div>
            <div className="rounded-xl bg-card p-4">
              <p className="text-sm text-muted">Последняя активность</p>
              <p className="mt-2">{stats.data.lastActivity ? formatDate(stats.data.lastActivity) : 'Пока нет'}</p>
            </div>
          </section>
        </>
      )}

      <Modal open={editing} title="Редактирование профиля" onClose={() => setEditing(false)}>
        <ProfileEditForm onSaved={() => setEditing(false)} />
      </Modal>
    </div>
  )
}
