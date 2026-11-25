import type { Genre, Movie } from '../types'

// Самые частые жанры в списке фильмов (для рекомендаций)
export function topGenreIds(movies: Movie[], count: number): number[] {
  const counter = new Map<number, number>()
  for (const movie of movies) {
    for (const genre of movie.genres) counter.set(genre.id, (counter.get(genre.id) ?? 0) + 1)
  }
  return [...counter.entries()]
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, count)
    .map(([id]) => id)
}

// Рекомендации: исключаем уже добавленные фильмы и берём первые count
export function pickRecommendations(candidates: Movie[], excludedIds: Set<number>, count: number): Movie[] {
  return candidates.filter((movie) => !excludedIds.has(movie.id)).slice(0, count)
}

// Поиск и сортировка внутри списка (используются там, где данные уже загружены)
export function filterByTitle(movies: Movie[], query: string): Movie[] {
  const value = query.trim().toLowerCase()
  if (!value) return movies
  return movies.filter(
    (m) => m.title.toLowerCase().includes(value) || (m.original_title ?? '').toLowerCase().includes(value),
  )
}

export function sortMovies(movies: Movie[], sort: 'title' | 'year' | 'rating', order: 'asc' | 'desc'): Movie[] {
  const direction = order === 'asc' ? 1 : -1
  return [...movies].sort((a, b) => {
    if (sort === 'title') return a.title.localeCompare(b.title, 'ru') * direction
    if (sort === 'year') return (a.release_year - b.release_year) * direction
    // фильмы без рейтинга всегда в конце
    if (a.rating === null && b.rating === null) return 0
    if (a.rating === null) return 1
    if (b.rating === null) return -1
    return (a.rating - b.rating) * direction
  })
}

export function genreNames(genres: Genre[]): string {
  return genres.map((g) => g.name).join(', ')
}
