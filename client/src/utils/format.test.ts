import { describe, expect, it } from 'vitest'
import { formatDate, formatDuration, formatRating, initials, pluralize, typeLabel } from './format'

describe('formatDuration', () => {
  it('часы и минуты', () => expect(formatDuration(148)).toBe('2 ч 28 мин'))
  it('только минуты', () => expect(formatDuration(49)).toBe('49 мин'))
  it('ровные часы', () => expect(formatDuration(120)).toBe('2 ч'))
  it('нет данных', () => {
    expect(formatDuration(null)).toBe('—')
    expect(formatDuration(0)).toBe('—')
    expect(formatDuration(undefined)).toBe('—')
  })
})

describe('formatDate', () => {
  it('форматирует дату по-русски', () => {
    const text = formatDate('2026-11-14T10:00:00Z')
    expect(text).toContain('2026')
    expect(text).toContain('14')
  })
  it('некорректная дата', () => {
    expect(formatDate('не дата')).toBe('—')
    expect(formatDate(null)).toBe('—')
  })
})

describe('formatRating', () => {
  it('одна цифра после запятой', () => expect(formatRating(8)).toBe('8.0'))
  it('нет рейтинга', () => expect(formatRating(null)).toBe('—'))
})

describe('pluralize', () => {
  const forms: [string, string, string] = ['фильм', 'фильма', 'фильмов']
  it.each([
    [1, 'фильм'], [2, 'фильма'], [4, 'фильма'], [5, 'фильмов'], [0, 'фильмов'],
    [11, 'фильмов'], [12, 'фильмов'], [21, 'фильм'], [22, 'фильма'], [111, 'фильмов'], [101, 'фильм'],
  ])('%i -> %s', (count, expected) => expect(pluralize(count, forms)).toBe(expected))
})

describe('typeLabel и initials', () => {
  it('подписи типов', () => {
    expect(typeLabel('movie')).toBe('Фильм')
    expect(typeLabel('series')).toBe('Сериал')
  })
  it('инициалы', () => {
    expect(initials('иван петров')).toBe('ИП')
    expect(initials('Анна')).toBe('А')
    expect(initials('   ')).toBe('?')
  })
})
