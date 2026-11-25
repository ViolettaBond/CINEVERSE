import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import type { AppNotification } from '../types'
import { initials } from '../utils/format'
import { BellIcon } from './icons'
import SearchBar from './SearchBar'

export default function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [unread, setUnread] = useState(0)

  // Счётчик непрочитанных обновляется при каждом переходе по страницам
  useEffect(() => {
    api
      .get<{ items: AppNotification[]; unreadCount: number }>('/notifications')
      .then((res) => setUnread(res.data.unreadCount))
      .catch(() => setUnread(0))
  }, [location.pathname])

  if (!user) return null

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/5 bg-bg/75 px-4 py-3 backdrop-blur-xl md:px-8">
      <SearchBar />
      <div className="ml-auto flex items-center gap-3">
        <Link to="/notifications" aria-label={`Уведомления, непрочитанных: ${unread}`} className="relative rounded-full p-2 text-muted hover:bg-card hover:text-text">
          <BellIcon />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-bg">
              {unread}
            </span>
          )}
        </Link>
        <Link to="/profile" className="flex items-center gap-2 rounded-full p-1 hover:bg-card">
          {user.avatar ? (
            <img src={user.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-xs font-semibold text-accent-soft">
              {initials(user.username)}
            </span>
          )}
          <span className="hidden pr-2 text-sm sm:block">{user.username}</span>
        </Link>
        <button
          onClick={() => {
            logout()
            navigate('/login')
          }}
          className="rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-card hover:text-text"
        >
          Выйти
        </button>
      </div>
    </header>
  )
}
