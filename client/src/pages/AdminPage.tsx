import { useState } from 'react'
import AdminGenres from './admin/AdminGenres'
import AdminMovies from './admin/AdminMovies'
import AdminReviews from './admin/AdminReviews'
import AdminStats from './admin/AdminStats'
import AdminUsers from './admin/AdminUsers'

const TABS = [
  { id: 'stats', label: 'Статистика', view: <AdminStats /> },
  { id: 'movies', label: 'Фильмы и сериалы', view: <AdminMovies /> },
  { id: 'genres', label: 'Жанры', view: <AdminGenres /> },
  { id: 'users', label: 'Пользователи', view: <AdminUsers /> },
  { id: 'reviews', label: 'Отзывы', view: <AdminReviews /> },
]

export default function AdminPage() {
  const [tab, setTab] = useState('stats')
  return (
    <div>
      <h1 className="text-2xl font-semibold">Административная панель</h1>
      <div className="mt-4 flex gap-2 overflow-x-auto border-b border-white/10 pb-2" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm transition ${tab === t.id ? 'bg-accent text-bg' : 'text-muted hover:bg-card hover:text-text'}`}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="mt-5">{TABS.find((t) => t.id === tab)?.view}</div>
    </div>
  )
}
