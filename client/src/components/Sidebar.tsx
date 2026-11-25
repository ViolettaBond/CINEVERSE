import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const links = [
  { to: '/', label: 'Главная' },
  { to: '/catalog', label: 'Каталог' },
  { to: '/collection', label: 'Моя коллекция' },
  { to: '/playlists', label: 'Мои подборки' },
  { to: '/reviews', label: 'Мои отзывы' },
  { to: '/notifications', label: 'Уведомления' },
  { to: '/profile', label: 'Профиль' },
  { to: '/settings', label: 'Настройки' },
]

export default function Sidebar() {
  const { user } = useAuth()
  // Ссылка «Админ-панель» — только удобство; доступ на самом деле проверяет сервер
  const items = user?.role === 'administrator' ? [...links, { to: '/admin', label: 'Админ-панель' }] : links

  return (
    <aside className="border-b border-white/5 bg-surface/90 p-4 md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0 md:overflow-y-auto md:border-b-0 md:border-r md:p-6">
      <div className="mb-4 flex items-center gap-2 md:mb-8">
        <span className="h-3 w-3 rounded-full bg-gradient-to-br from-accent to-cool shadow-lg shadow-accent/40" />
        <span className="bg-gradient-to-r from-accent-soft to-cool bg-clip-text text-xl font-extrabold tracking-wide text-transparent">Cineverse</span>
      </div>
      <nav className="flex gap-1.5 overflow-x-auto md:flex-col" aria-label="Основное меню">
        {items.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) =>
              `relative whitespace-nowrap rounded-xl px-3 py-2 text-sm transition-colors ${
                isActive
                  ? 'bg-accent/15 font-medium text-accent-soft before:absolute before:left-0 before:top-1/2 before:hidden before:h-5 before:w-1 before:-translate-y-1/2 before:rounded-full before:bg-accent md:before:block'
                  : 'text-muted hover:bg-card hover:text-text'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
