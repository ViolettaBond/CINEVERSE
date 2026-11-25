// Функции форматирования данных для интерфейса

export function formatDuration(minutes: number | null | undefined): string {
  if (!minutes || minutes <= 0) return '—'
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest} мин`
  return rest === 0 ? `${hours} ч` : `${hours} ч ${rest} мин`
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

export function formatRating(rating: number | null | undefined): string {
  return rating === null || rating === undefined ? '—' : rating.toFixed(1)
}

// pluralize(5, ['фильм', 'фильма', 'фильмов']) -> «фильмов»
export function pluralize(count: number, forms: [string, string, string]): string {
  const n = Math.abs(count) % 100
  const last = n % 10
  if (n > 10 && n < 20) return forms[2]
  if (last > 1 && last < 5) return forms[1]
  if (last === 1) return forms[0]
  return forms[2]
}

export function typeLabel(type: 'movie' | 'series'): string {
  return type === 'series' ? 'Сериал' : 'Фильм'
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  return parts
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}
