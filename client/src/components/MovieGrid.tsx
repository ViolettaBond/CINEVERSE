import type { ReactNode } from 'react'
import type { Movie } from '../types'
import MovieCard from './MovieCard'

type Props = {
  movies: Movie[]
  renderActions?: (movie: Movie) => ReactNode
  // row: на телефоне ряд листается пальцем вбок, на больших экранах — сетка
  variant?: 'grid' | 'row'
}

export default function MovieGrid({ movies, renderActions, variant = 'grid' }: Props) {
  if (variant === 'row') {
    return (
      <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4 xl:grid-cols-6">
        {movies.map((movie) => (
          <div key={movie.id} className="w-36 shrink-0 snap-start sm:w-auto">
            <MovieCard movie={movie} actions={renderActions?.(movie)} />
          </div>
        ))}
      </div>
    )
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} actions={renderActions?.(movie)} />
      ))}
    </div>
  )
}
