import { describe, expect, it } from 'vitest'
import { defaultFilters, filtersToParams, getPageNumbers, hasActiveFilters, paramsToFilters } from './catalog'

describe('filtersToParams', () => {
  it('значения по умолчанию дают пустые параметры', () => expect(filtersToParams(defaultFilters)).toEqual({}))
  it('включает только заполненные фильтры', () => {
    const params = filtersToParams({ ...defaultFilters, q: ' матрица ', genre: '2', sort: 'rating', order: 'desc', page: 3 })
    expect(params).toEqual({ q: 'матрица', genre: '2', sort: 'rating', order: 'desc', page: '3' })
  })
  it('первая страница не попадает в адрес', () => {
    expect(filtersToParams({ ...defaultFilters, page: 1 }).page).toBeUndefined()
  })
})

describe('paramsToFilters', () => {
  it('пустая адресная строка даёт значения по умолчанию', () => {
    expect(paramsToFilters(new URLSearchParams(''))).toEqual(defaultFilters)
  })
  it('разбирает параметры', () => {
    const f = paramsToFilters(new URLSearchParams('q=дюна&type=movie&yearFrom=2020&sort=year&order=desc&page=2'))
    expect(f).toMatchObject({ q: 'дюна', type: 'movie', yearFrom: '2020', sort: 'year', order: 'desc', page: 2 })
  })
  it('игнорирует недопустимые значения', () => {
    const f = paramsToFilters(new URLSearchParams('type=game&sort=id&order=up&page=-5'))
    expect(f).toMatchObject({ type: '', sort: 'title', order: 'asc', page: 1 })
  })
  it('преобразование туда и обратно сохраняет фильтры', () => {
    const original = { ...defaultFilters, q: 'тест', type: 'series' as const, ratingMin: '7', page: 4 }
    expect(paramsToFilters(new URLSearchParams(filtersToParams(original)))).toEqual(original)
  })
})

describe('hasActiveFilters', () => {
  it('без фильтров', () => expect(hasActiveFilters(defaultFilters)).toBe(false))
  it('сортировка и страница не считаются фильтрами', () => {
    expect(hasActiveFilters({ ...defaultFilters, sort: 'year', page: 5 })).toBe(false)
  })
  it('поиск считается фильтром', () => expect(hasActiveFilters({ ...defaultFilters, q: 'a' })).toBe(true))
})

describe('getPageNumbers', () => {
  it('мало страниц — все подряд', () => expect(getPageNumbers(2, 5)).toEqual([1, 2, 3, 4, 5]))
  it('начало', () => expect(getPageNumbers(1, 20)).toEqual([1, 2, '…', 20]))
  it('середина', () => expect(getPageNumbers(10, 20)).toEqual([1, '…', 9, 10, 11, '…', 20]))
  it('конец', () => expect(getPageNumbers(20, 20)).toEqual([1, '…', 19, 20]))
  it('одна страница', () => expect(getPageNumbers(1, 1)).toEqual([1]))
})
