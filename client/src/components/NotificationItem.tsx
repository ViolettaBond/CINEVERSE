import { useNavigate } from 'react-router-dom'
import type { AppNotification } from '../types'
import { formatDate } from '../utils/format'

type Props = {
  notification: AppNotification
  onRead: (id: number) => void
  onDelete: (id: number) => void
}

const TYPE_LABELS = { system: 'Система', collection: 'Подборки', review: 'Отзывы' } as const

export default function NotificationItem({ notification, onRead, onDelete }: Props) {
  const navigate = useNavigate()

  const open = () => {
    if (!notification.is_read) onRead(notification.id)
    if (notification.link) navigate(notification.link)
  }

  return (
    <li className={`flex items-start gap-3 rounded-xl p-4 ${notification.is_read ? 'bg-card/60' : 'bg-card ring-1 ring-accent/40'}`}>
      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notification.is_read ? 'bg-transparent' : 'bg-accent'}`} aria-label={notification.is_read ? 'Прочитано' : 'Новое'} />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted">
          {TYPE_LABELS[notification.type]} · {formatDate(notification.created_at)}
        </p>
        <p className="font-medium">{notification.title}</p>
        <p className="text-sm text-muted">{notification.message}</p>
        <div className="mt-2 flex flex-wrap gap-3 text-sm">
          {notification.link && (
            <button onClick={open} className="text-accent-soft hover:underline">Перейти</button>
          )}
          {!notification.is_read && (
            <button onClick={() => onRead(notification.id)} className="text-muted hover:text-text">Отметить прочитанным</button>
          )}
          <button onClick={() => onDelete(notification.id)} className="text-muted hover:text-red-400">Удалить</button>
        </div>
      </div>
    </li>
  )
}
