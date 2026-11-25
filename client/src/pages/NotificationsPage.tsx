import NotificationItem from '../components/NotificationItem'
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews'
import { useToast } from '../context/ToastContext'
import { useFetch } from '../hooks/useFetch'
import { api, getErrorMessage } from '../services/api'
import { buttonSecondary } from '../styles'
import type { AppNotification } from '../types'

type Response = { items: AppNotification[]; unreadCount: number }

export default function NotificationsPage() {
  const toast = useToast()
  const { data, loading, error, reload } = useFetch(() => api.get<Response>('/notifications').then((r) => r.data), [])

  const run = async (action: () => Promise<unknown>, success?: string) => {
    try {
      await action()
      if (success) toast.success(success)
      reload()
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Уведомления</h1>
        <button disabled={!data || data.unreadCount === 0} onClick={() => void run(() => api.patch('/notifications/read-all'), 'Все уведомления прочитаны')} className={buttonSecondary}>
          Отметить все прочитанными
        </button>
      </div>
      <div className="mt-6">
        {loading && <LoadingState />}
        {!loading && error && <ErrorState text={error} onRetry={reload} />}
        {!loading && !error && data?.items.length === 0 && <EmptyState title="Уведомлений пока нет" text="Здесь появятся события ваших подборок и отзывов." />}
        <ul className="space-y-3">
          {data?.items.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              onRead={(id) => void run(() => api.patch(`/notifications/${id}/read`))}
              onDelete={(id) => void run(() => api.delete(`/notifications/${id}`), 'Уведомление удалено')}
            />
          ))}
        </ul>
      </div>
    </div>
  )
}
