import type { MouseEvent, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLists } from '../context/ListsContext'
import type { Movie } from '../types'
import { formatRating, typeLabel } from '../utils/format'
import { HeartIcon, StarIcon } from './icons'
import Poster from './Poster'

type Props = { movie: Movie; actions?: ReactNode }

export default function MovieCard({ movie, actions }: Props) {
  const { user } = useAuth()
  const lists = useLists()
  const isFavorite = lists.has('favorites', movie.id)

  const onHeart = (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    void lists.toggle('favorites', movie.id)
  }

  return (
    <div className="group flex flex-col">
      <Link
        to={`/movie/${movie.id}`}
        aria-label={movie.title}
        className="relative block overflow-hidden rounded-2xl bg-card shadow-lg shadow-black/30 ring-1 ring-white/5 transition duration-300 group-hover:-translate-y-1 group-hover:shadow-2xl group-hover:shadow-accent/20 group-hover:ring-accent/40"
      >
        <Poster title={movie.title} url={movie.poster_url} className="aspect-[2/3] w-full transition duration-500 group-hover:scale-105" />
        {/* затемнение снизу появляется при наведении */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
        <span className="pointer-events-none absolute inset-x-3 bottom-3 translate-y-2 text-xs text-white opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          {movie.genres.map((g) => g.name).slice(0, 2).join(' · ') || typeLabel(movie.type)}
        </span>
        <span className="absolute left-2 top-2 flex items-center gap-1 rounded-lg bg-black/65 px-2 py-0.5 text-xs font-semibold backdrop-blur">
          <StarIcon className="h-3 w-3 text-accent" filled />
          {formatRating(movie.rating)}
        </span>
        {movie.type === 'series' && (
          <span className="absolute bottom-2 left-2 rounded-md bg-cool/90 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-bg group-hover:opacity-0">
            Сериал
          </span>
        )}
        {user && (
          <button
            onClick={onHeart}
            aria-label={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
            aria-pressed={isFavorite}
            className={`absolute right-2 top-2 rounded-full bg-black/65 p-1.5 backdrop-blur transition hover:scale-110 hover:bg-black ${isFavorite ? 'text-accent' : 'text-white'}`}
          >
            <HeartIcon className="h-4 w-4" filled={isFavorite} />
          </button>
        )}
      </Link>
      <Link to={`/movie/${movie.id}`} className="mt-2.5 line-clamp-2 text-sm font-medium leading-snug transition hover:text-accent-soft">
        {movie.title}
      </Link>
      <p className="text-xs text-muted">
        {movie.release_year} · {movie.genres[0]?.name ?? typeLabel(movie.type)}
      </p>
      {actions && <div className="mt-2 flex flex-wrap gap-3">{actions}</div>}
    </div>
  )
}
