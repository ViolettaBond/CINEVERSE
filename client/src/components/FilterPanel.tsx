import type { Genre } from '../types'
import { inputClass, labelClass } from '../styles'
import { defaultFilters, hasActiveFilters, type CatalogFilters } from '../utils/catalog'

type Props = { filters: CatalogFilters; genres: Genre[]; onChange: (filters: CatalogFilters) => void }

export default function FilterPanel({ filters, genres, onChange }: Props) {
  // При изменении любого фильтра возвращаемся на первую страницу
  const set = <K extends keyof CatalogFilters>(key: K, value: CatalogFilters[K]) =>
    onChange({ ...filters, [key]: value, page: 1 })

  return (
    <section className="rounded-xl bg-card p-4" aria-label="Фильтры">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-4">
          <label className={labelClass} htmlFor="f-q">Поиск по названию</label>
          <input id="f-q" className={inputClass} value={filters.q} placeholder="Например, Матрица" onChange={(e) => set('q', e.target.value)} />
        </div>
        <div>
          <label className={labelClass} htmlFor="f-type">Тип</label>
          <select id="f-type" className={inputClass} value={filters.type} onChange={(e) => set('type', e.target.value as CatalogFilters['type'])}>
            <option value="">Фильмы и сериалы</option>
            <option value="movie">Фильмы</option>
            <option value="series">Сериалы</option>
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="f-genre">Жанр</label>
          <select id="f-genre" className={inputClass} value={filters.genre} onChange={(e) => set('genre', e.target.value)}>
            <option value="">Все жанры</option>
            {genres.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="f-from">Год от</label>
          <input id="f-from" type="number" min={1888} max={2100} className={inputClass} value={filters.yearFrom} onChange={(e) => set('yearFrom', e.target.value)} />
        </div>
        <div>
          <label className={labelClass} htmlFor="f-to">Год до</label>
          <input id="f-to" type="number" min={1888} max={2100} className={inputClass} value={filters.yearTo} onChange={(e) => set('yearTo', e.target.value)} />
        </div>
        <div>
          <label className={labelClass} htmlFor="f-rating">Рейтинг от</label>
          <select id="f-rating" className={inputClass} value={filters.ratingMin} onChange={(e) => set('ratingMin', e.target.value)}>
            <option value="">Любой</option>
            {[6, 7, 8, 9].map((n) => (
              <option key={n} value={n}>{n} и выше</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="f-sort">Сортировка</label>
          <select id="f-sort" className={inputClass} value={filters.sort} onChange={(e) => set('sort', e.target.value as CatalogFilters['sort'])}>
            <option value="title">По названию</option>
            <option value="year">По дате выхода</option>
            <option value="rating">По рейтингу</option>
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="f-order">Порядок</label>
          <select id="f-order" className={inputClass} value={filters.order} onChange={(e) => set('order', e.target.value as CatalogFilters['order'])}>
            <option value="asc">По возрастанию</option>
            <option value="desc">По убыванию</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            type="button"
            disabled={!hasActiveFilters(filters)}
            onClick={() => onChange({ ...defaultFilters, sort: filters.sort, order: filters.order })}
            className="w-full rounded-lg border border-white/10 px-4 py-2 text-sm hover:border-accent/60 disabled:opacity-40"
          >
            Сбросить фильтры
          </button>
        </div>
      </div>
    </section>
  )
}
