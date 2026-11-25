import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import FilterPanel from '../components/FilterPanel'
import MovieGrid from '../components/MovieGrid'
import Pagination from '../components/Pagination'
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews'
import { useFetch } from '../hooks/useFetch'
import { api } from '../services/api'
import type { Genre, Movie, Paginated } from '../types'
import { filtersToParams, paramsToFilters, type CatalogFilters } from '../utils/catalog'
import { pluralize } from '../utils/format'
import { buttonSecondary } from '../styles'

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = paramsToFilters(searchParams)
  const queryKey = searchParams.toString()
  const [showFilters, setShowFilters] = useState(false)

  const genres = useFetch(() => api.get<Genre[]>('/genres').then((r) => r.data), [])
  const movies = useFetch(
    () => api.get<Paginated<Movie>>('/movies', { params: { ...filtersToParams(filters), limit: 12 } }).then((r) => r.data),
    [queryKey],
  )

  // Фильтры хранятся в адресной строке: страницу можно обновить или отправить ссылкой
  const update = (next: CatalogFilters) => setSearchParams(filtersToParams(next), { replace: true })

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Каталог</h1>
      <button onClick={() => setShowFilters((v) => !v)} aria-expanded={showFilters} className={`${buttonSecondary} mt-4 lg:hidden`}>
        {showFilters ? 'Скрыть фильтры' : 'Показать фильтры'}
      </button>
      <div className={`mt-4 ${showFilters ? 'block' : 'hidden'} lg:block`}>
        <FilterPanel filters={filters} genres={genres.data ?? []} onChange={update} />
      </div>

      <div className="mt-6">
        {movies.loading && <LoadingState />}
        {!movies.loading && movies.error && <ErrorState text={movies.error} onRetry={movies.reload} />}
        {!movies.loading && !movies.error && movies.data && (
          <>
            <p className="mb-4 text-sm text-muted">
              Найдено: {movies.data.total} {pluralize(movies.data.total, ['позиция', 'позиции', 'позиций'])}
            </p>
            {movies.data.items.length === 0 ? (
              <EmptyState title="Ничего не найдено" text="Попробуйте изменить или сбросить фильтры." />
            ) : (
              <MovieGrid movies={movies.data.items} />
            )}
            <Pagination page={movies.data.page} totalPages={movies.data.totalPages} onChange={(page) => update({ ...filters, page })} />
          </>
        )}
      </div>
    </div>
  )
}
