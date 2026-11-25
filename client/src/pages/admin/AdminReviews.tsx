import { useState } from 'react'
import { ConfirmDialog } from '../../components/Modal'
import { EmptyState, ErrorState, LoadingState } from '../../components/StateViews'
import { useToast } from '../../context/ToastContext'
import { useFetch } from '../../hooks/useFetch'
import { api, getErrorMessage } from '../../services/api'
import type { AdminReview } from '../../types'
import { formatDate } from '../../utils/format'

export default function AdminReviews() {
  const toast = useToast()
  const { data, loading, error, reload } = useFetch(() => api.get<AdminReview[]>('/admin/reviews').then((r) => r.data), [])
  const [deleting, setDeleting] = useState<AdminReview | null>(null)

  const remove = async () => {
    if (!deleting) return
    try {
      await api.delete(`/admin/reviews/${deleting.id}`)
      toast.success('Отзыв удалён, автор уведомлён')
      setDeleting(null)
      reload()
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  if (loading) return <LoadingState />
  if (error) return <ErrorState text={error} onRetry={reload} />
  if (data?.length === 0) return <EmptyState title="Отзывов пока нет" />
  return (
    <div>
      <ul className="space-y-3">
        {data?.map((r) => (
          <li key={r.id} className="rounded-xl bg-card p-4">
            <p className="text-xs text-muted">{r.username} · {r.movie_title} · {formatDate(r.created_at)}</p>
            <p className="mt-1 whitespace-pre-line text-sm">{r.text}</p>
            <button onClick={() => setDeleting(r)} className="mt-2 text-sm text-red-400 hover:underline">Удалить</button>
          </li>
        ))}
      </ul>
      <ConfirmDialog open={deleting !== null} title="Удалить отзыв?" message="Автор получит уведомление об удалении." confirmLabel="Удалить" danger onConfirm={() => void remove()} onCancel={() => setDeleting(null)} />
    </div>
  )
}
