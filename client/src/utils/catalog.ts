// Фильтры каталога и преобразование их в параметры адресной строки / запроса к API

export type CatalogFilters = {
  q: string
  genre: string
  type: '' | 'movie' | 'series'
  yearFrom: string
  yearTo: string
  ratingMin: string
  sort: 'title' | 'year' | 'rating'
  order: 'asc' | 'desc'
  page: number
}

export const defaultFilters: CatalogFilters = {
  q: '',
  genre: '',
  type: '',
  yearFrom: '',
  yearTo: '',
  ratingMin: '',
  sort: 'title',
  order: 'asc',
  page: 1,
}

// Только непустые значения, отличающиеся от значений по умолчанию
export function filtersToParams(filters: CatalogFilters): Record<string, string> {
  const params: Record<string, string> = {}
  if (filters.q.trim()) params.q = filters.q.trim()
  if (filters.genre) params.genre = filters.genre
  if (filters.type) params.type = filters.type
  if (filters.yearFrom) params.yearFrom = filters.yearFrom
  if (filters.yearTo) params.yearTo = filters.yearTo
  if (filters.ratingMin) params.ratingMin = filters.ratingMin
  if (filters.sort !== defaultFilters.sort) params.sort = filters.sort
  if (filters.order !== defaultFilters.order) params.order = filters.order
  if (filters.page > 1) params.page = String(filters.page)
  return params
}

export function paramsToFilters(params: URLSearchParams): CatalogFilters {
  const type = params.get('type')
  const sort = params.get('sort')
  const order = params.get('order')
  const page = Number(params.get('page'))
  return {
    q: params.get('q') ?? '',
    genre: params.get('genre') ?? '',
    type: type === 'movie' || type === 'series' ? type : '',
    yearFrom: params.get('yearFrom') ?? '',
    yearTo: params.get('yearTo') ?? '',
    ratingMin: params.get('ratingMin') ?? '',
    sort: sort === 'year' || sort === 'rating' ? sort : 'title',
    order: order === 'desc' ? 'desc' : 'asc',
    page: Number.isInteger(page) && page > 1 ? page : 1,
  }
}

export function hasActiveFilters(filters: CatalogFilters): boolean {
  return Boolean(filters.q || filters.genre || filters.type || filters.yearFrom || filters.yearTo || filters.ratingMin)
}

// Номера страниц для пагинации: 1 … 4 5 [6] 7 8 … 20
export function getPageNumbers(page: number, totalPages: number): (number | '…')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
  const pages: (number | '…')[] = [1]
  const start = Math.max(2, page - 1)
  const end = Math.min(totalPages - 1, page + 1)
  if (start > 2) pages.push('…')
  for (let i = start; i <= end; i++) pages.push(i)
  if (end < totalPages - 1) pages.push('…')
  pages.push(totalPages)
  return pages
}
