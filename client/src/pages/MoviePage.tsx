import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ConfirmDialog } from '../components/Modal'
import MovieGrid from '../components/MovieGrid'
import Poster from '../components/Poster'
import RatingStars from '../components/RatingStars'
import ReviewCard from '../components/ReviewCard'
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews'
import { useAuth } from '../context/AuthContext'
import { useLists } from '../context/ListsContext'
import { useToast } from '../context/ToastContext'
import { useFetch } from '../hooks/useFetch'
import { api, getErrorMessage } from '../services/api'
import { buttonPrimary, buttonSecondary, errorTextClass, inputClass } from '../styles'
import type { ListName, MovieDetails, RatingInfo, Review } from '../types'
import { formatDuration, formatRating, typeLabel } from '../utils/format'
import { validateReviewText } from '../utils/validation'

const ACTIONS: { list: ListName; on: string; off: string }[] = [
  { list: 'favorites', on: '♥ В избранном', off: '♡ В избранное' },
  { list: 'watchlist', on: '✓ В списке «Посмотреть позже»', off: 'Посмотреть позже' },
  { list: 'watched', on: '✓ Просмотрено', off: 'Отметить просмотренным' },
]

function Info({ label, value }: { label: string; value: string | null }) {
  if (!value) return null
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-sm">{value}</dd>
    </div>
  )
}

export default function MoviePage() {
  const { id } = useParams()
  const movieId = Number(id)
  const { user } = useAuth()
  const lists = useLists()
  const toast = useToast()

  const movie = useFetch(() => api.get<MovieDetails>(`/movies/${movieId}`).then((r) => r.data), [movieId])
  const ratings = useFetch(() => api.get<RatingInfo>(`/movies/${movieId}/ratings`).then((r) => r.data), [movieId, user?.id])
  const reviews = useFetch(() => api.get<Review[]>(`/movies/${movieId}/reviews`).then((r) => r.data), [movieId])

  const [text, setText] = useState('')
  const [textError, setTextError] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)

  if (movie.loading) return <LoadingState />
  if (movie.error || !movie.data) return <ErrorState text={movie.error || 'Фильм не найден'} onRetry={movie.reload} />

  const m = movie.data
  const myReview = reviews.data?.find((r) => r.user_id === user?.id)

  const rate = async (rating: number) => {
    try {
      const hasRating = ratings.data?.userRating !== null && ratings.data?.userRating !== undefined
      const res = hasRating
        ? await api.put<RatingInfo>(`/movies/${movieId}/ratings`, { rating })
        : await api.post<RatingInfo>(`/movies/${movieId}/ratings`, { rating })
      ratings.setData(res.data)
      toast.success('Оценка сохранена')
      reviews.reload()
      movie.reload()
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const submitReview = async (event: FormEvent) => {
    event.preventDefault()
    const error = validateReviewText(text)
    setTextError(error)
    if (error) return
    setBusy(true)
    try {
      if (editingId) await api.put(`/reviews/${editingId}`, { text })
      else await api.post(`/movies/${movieId}/reviews`, { text })
      toast.success(editingId ? 'Отзыв обновлён' : 'Отзыв опубликован')
      setText('')
      setEditingId(null)
      reviews.reload()
    } catch (e) {
      toast.error(getErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const removeReview = async () => {
    if (deleteId === null) return
    setBusy(true)
    try {
      await api.delete(`/reviews/${deleteId}`)
      toast.success('Отзыв удалён')
      setDeleteId(null)
      reviews.reload()
    } catch (e) {
      toast.error(getErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <section className="relative overflow-hidden rounded-3xl bg-card shadow-2xl shadow-black/40 ring-1 ring-white/5">
        {m.backdrop_url && <img src={m.backdrop_url} alt="" className="absolute inset-0 h-full w-full scale-105 object-cover opacity-50" />}
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/80 to-bg/20" />
        <div className="relative flex flex-col gap-6 p-5 md:flex-row md:gap-10 md:p-10">
          <Poster title={m.title} url={m.poster_url} className="mx-auto aspect-[2/3] w-48 shrink-0 rounded-2xl shadow-2xl shadow-black/60 ring-1 ring-white/10 md:mx-0 md:w-60" />
          <div className="flex-1">
            <p className="text-sm text-accent-soft">{typeLabel(m.type)}</p>
            <h1 className="text-3xl font-extrabold leading-tight md:text-4xl">{m.title}</h1>
            {m.original_title && <p className="text-muted">{m.original_title}</p>}
            <p className="mt-2 text-sm text-muted">
              {m.release_year} · {formatDuration(m.duration)}{m.type === 'series' && ' (серия)'} · {m.country ?? '—'} · {m.age_rating ?? '—'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {m.genres.map((g) => (
                <Link key={g.id} to={`/catalog?genre=${g.id}`} className="rounded-full bg-accent/15 px-3 py-1 text-xs text-accent-soft hover:bg-accent/25">{g.name}</Link>
              ))}
            </div>
            <p className="mt-4 flex items-baseline gap-2">
              <span className="rounded-lg bg-accent/20 px-3 py-1 text-xl font-bold text-accent-soft">★ {formatRating(ratings.data?.average ?? m.rating)}</span>
              <span className="text-sm text-muted">{ratings.data?.count ?? m.ratings_count} оценок</span>
            </p>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed">{m.description}</p>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <Info label="Режиссёр" value={m.director} />
              <Info label="Сценаристы" value={m.writers} />
              <div className="sm:col-span-2"><Info label="В ролях" value={m.cast_list} /></div>
            </dl>

            {user && (
              <div className="mt-5 flex flex-wrap gap-2">
                {ACTIONS.map(({ list, on, off }) => {
                  const active = lists.has(list, m.id)
                  return (
                    <button key={list} onClick={() => void lists.toggle(list, m.id)} aria-pressed={active} className={active ? buttonPrimary : buttonSecondary}>
                      {active ? on : off}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 flex items-center gap-3 text-xl font-semibold"><span className="h-6 w-1 rounded-full bg-gradient-to-b from-accent to-cool" />Ваша оценка</h2>
        {user ? (
          <div>
            <RatingStars value={ratings.data?.userRating ?? null} onChange={rate} />
            <p className="mt-1 text-sm text-muted">
              {ratings.data?.userRating ? `Вы поставили ${ratings.data.userRating} из 10. Нажмите на звезду, чтобы изменить.` : 'Нажмите на звезду, чтобы оценить.'}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted"><Link to="/login" className="text-accent-soft hover:underline">Войдите</Link>, чтобы оценить фильм.</p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 flex items-center gap-3 text-xl font-semibold"><span className="h-6 w-1 rounded-full bg-gradient-to-b from-accent to-cool" />Отзывы</h2>
        {user && (!myReview || editingId) && (
          <form onSubmit={submitReview} noValidate className="mb-5 space-y-2">
            <textarea
              aria-label="Текст отзыва"
              rows={4}
              className={inputClass}
              placeholder="Поделитесь впечатлением о фильме"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            {textError && <p className={errorTextClass}>{textError}</p>}
            <div className="flex gap-3">
              <button type="submit" disabled={busy} className={buttonPrimary}>{editingId ? 'Сохранить' : 'Опубликовать'}</button>
              {editingId && (
                <button type="button" className={buttonSecondary} onClick={() => { setEditingId(null); setText(''); setTextError('') }}>Отмена</button>
              )}
            </div>
          </form>
        )}
        {reviews.loading && <LoadingState />}
        {!reviews.loading && reviews.error && <ErrorState text={reviews.error} onRetry={reviews.reload} />}
        {!reviews.loading && !reviews.error && reviews.data?.length === 0 && <EmptyState title="Отзывов пока нет" text="Будьте первым, кто поделится мнением." />}
        <div className="space-y-3">
          {reviews.data?.map((review) => (
            <ReviewCard
              key={review.id}
              author={review.username}
              avatar={review.avatar}
              rating={review.rating}
              text={review.text}
              date={review.created_at}
              edited={review.updated_at !== review.created_at}
              actions={
                review.user_id === user?.id ? (
                  <>
                    <button className="text-sm text-accent-soft hover:underline" onClick={() => { setEditingId(review.id); setText(review.text) }}>Редактировать</button>
                    <button className="text-sm text-red-400 hover:underline" onClick={() => setDeleteId(review.id)}>Удалить</button>
                  </>
                ) : undefined
              }
            />
          ))}
        </div>
      </section>

      {m.similar.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 flex items-center gap-3 text-xl font-semibold"><span className="h-6 w-1 rounded-full bg-gradient-to-b from-accent to-cool" />Похожие фильмы</h2>
          <MovieGrid movies={m.similar} variant="row" />
        </section>
      )}

      <ConfirmDialog open={deleteId !== null} title="Удалить отзыв?" message="Это действие нельзя отменить." confirmLabel="Удалить" danger busy={busy} onConfirm={() => void removeReview()} onCancel={() => setDeleteId(null)} />
    </div>
  )
}
