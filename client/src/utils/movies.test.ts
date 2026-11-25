import { describe, expect, it } from 'vitest'
import type { Movie } from '../types'
import { filterByTitle, genreNames, pickRecommendations, sortMovies, topGenreIds } from './movies'

function movie(id: number, title: string, year: number, rating: number | null, genreIds: number[] = []): Movie {
  return {
    id, title, original_title: null, release_year: year, type: 'movie', age_rating: null, country: null,
    poster_url: null, genres: genreIds.map((g) => ({ id: g, name: `Жанр ${g}` })), rating, ratings_count: 0,
  }
}

const sample = [
  movie(1, 'Бета', 2010, 7.5, [1, 2]),
  movie(2, 'Альфа', 2020, null, [2]),
  movie(3, 'Гамма', 2000, 9, [2, 3]),
]

describe('topGenreIds', () => {
  it('самые частые жанры', () => expect(topGenreIds(sample, 2)).toEqual([2, 1]))
  it('пустой список', () => expect(topGenreIds([], 3)).toEqual([]))
})

describe('pickRecommendations', () => {
  it('исключает уже добавленные', () => {
    expect(pickRecommendations(sample, new Set([1]), 5).map((m) => m.id)).toEqual([2, 3])
  })
  it('ограничивает количество', () => expect(pickRecommendations(sample, new Set(), 1)).toHaveLength(1))
})

describe('filterByTitle', () => {
  it('без запроса возвращает всё', () => expect(filterByTitle(sample, '  ')).toHaveLength(3))
  it('ищет без учёта регистра', () => expect(filterByTitle(sample, 'аЛЬф').map((m) => m.id)).toEqual([2]))
  it('ничего не найдено', () => expect(filterByTitle(sample, 'zzz')).toEqual([]))
})

describe('sortMovies', () => {
  it('по названию', () => expect(sortMovies(sample, 'title', 'asc').map((m) => m.title)).toEqual(['Альфа', 'Бета', 'Гамма']))
  it('по году по убыванию', () => expect(sortMovies(sample, 'year', 'desc').map((m) => m.id)).toEqual([2, 1, 3]))
  it('по рейтингу: без рейтинга в конце', () => {
    expect(sortMovies(sample, 'rating', 'desc').map((m) => m.id)).toEqual([3, 1, 2])
    expect(sortMovies(sample, 'rating', 'asc').map((m) => m.id)).toEqual([1, 3, 2])
  })
  it('не изменяет исходный массив', () => {
    const copy = [...sample]
    sortMovies(sample, 'year', 'asc')
    expect(sample).toEqual(copy)
  })
})

describe('genreNames', () => {
  it('склеивает названия', () => expect(genreNames(sample[0].genres)).toBe('Жанр 1, Жанр 2'))
})
