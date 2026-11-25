import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ConfirmDialog, Modal } from '../components/Modal'
import ReviewCard from '../components/ReviewCard'
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews'
import { useToast } from '../context/ToastContext'
import { useFetch } from '../hooks/useFetch'
import { api, getErrorMessage } from '../services/api'
import { buttonPrimary, buttonSecondary, errorTextClass, inputClass } from '../styles'
import type { MyReview } from '../types'
import { validateReviewText } from '../utils/validation'

export default function ReviewsPage() {
  const toast = useToast()
  const { data, loading, error, reload } = useFetch(() => api.get<MyReview[]>('/reviews').then((r) => r.data), [])
  const [editing, setEditing] = useState<MyReview | null>(null)
  const [text, setText] = useState('')
  const [textError, setTextError] = useState('')
  const [deleting, setDeleting] = useState<MyReview | null>(null)

  const startEdit = (review: MyReview) => {
    setEditing(review)
    setText(review.text)
    setTextError('')
  }

  const save = async (event: FormEvent) => {
    event.preventDefault()
    const found = validateReviewText(text)
    setTextError(found)
    if (found || !editing) return
    try {
      await api.put(`/reviews/${editing.id}`, { text })
      toast.success('Отзыв обновлён')
      setEditing(null)
      reload()
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  const remove = async () => {
    if (!deleting) return
    try {
      await api.delete(`/reviews/${deleting.id}`)
      toast.success('Отзыв удалён')
      setDeleting(null)
      reload()
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Мои отзывы</h1>
      <div className="mt-6">
        {loading && <LoadingState />}
        {!loading && error && <ErrorState text={error} onRetry={reload} />}
        {!loading && !error && data?.length === 0 && (
          <EmptyState title="Вы ещё не писали отзывов" text="Откройте страницу фильма, чтобы поделиться мнением." action={<Link to="/catalog" className={buttonSecondary}>В каталог</Link>} />
        )}
        <div className="space-y-3">
          {data?.map((review) => (
            <div key={review.id}>
              <Link to={`/movie/${review.movie_id}`} className="mb-1 inline-block text-sm font-medium text-accent-soft hover:underline">{review.movie_title}</Link>
              <ReviewCard
                author="Вы"
                rating={review.rating}
                text={review.text}
                date={review.created_at}
                edited={review.updated_at !== review.created_at}
                actions={
                  <>
                    <button className="text-sm text-accent-soft hover:underline" onClick={() => startEdit(review)}>Редактировать</button>
                    <button className="text-sm text-red-400 hover:underline" onClick={() => setDeleting(review)}>Удалить</button>
                  </>
                }
              />
            </div>
          ))}
        </div>
      </div>

      <Modal open={editing !== null} title={`Отзыв: ${editing?.movie_title ?? ''}`} onClose={() => setEditing(null)}>
        <form onSubmit={save} noValidate className="space-y-3">
          <textarea aria-label="Текст отзыва" rows={6} className={inputClass} value={text} onChange={(e) => setText(e.target.value)} />
          {textError && <p className={errorTextClass}>{textError}</p>}
          <div className="flex justify-end gap-3">
            <button type="button" className={buttonSecondary} onClick={() => setEditing(null)}>Отмена</button>
            <button type="submit" className={buttonPrimary}>Сохранить</button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog open={deleting !== null} title="Удалить отзыв?" message="Это действие нельзя отменить." confirmLabel="Удалить" danger onConfirm={() => void remove()} onCancel={() => setDeleting(null)} />
    </div>
  )
}
