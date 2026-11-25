import { describe, expect, it } from 'vitest'
import {
  validateCollection, validateEmail, validateLogin, validateOptionalUrl, validatePassword,
  validateImageUrl, validateMovieForm, validatePasswordChange, validateRating, validateRegister, validateReviewText, validateUsername,
} from './validation'

describe('validateEmail', () => {
  it('корректный email', () => expect(validateEmail('a@b.co')).toBe(''))
  it('пустой', () => expect(validateEmail('  ')).not.toBe(''))
  it.each(['abc', 'a@b', '@b.co', 'a b@c.de'])('отклоняет %s', (value) => {
    expect(validateEmail(value)).not.toBe('')
  })
})

describe('validatePassword', () => {
  it('корректный пароль', () => expect(validatePassword('Secret123')).toBe(''))
  it('короткий', () => expect(validatePassword('a1')).toContain('8'))
  it('без цифры', () => expect(validatePassword('OnlyLetters')).toContain('цифру'))
  it('без буквы', () => expect(validatePassword('12345678')).toContain('букву'))
  it('слишком длинный', () => expect(validatePassword('a1'.repeat(40))).toContain('72'))
  it('пустой', () => expect(validatePassword('')).not.toBe(''))
})

describe('validateUsername', () => {
  it('нормальное имя', () => expect(validateUsername('Иван')).toBe(''))
  it('слишком короткое', () => expect(validateUsername(' И ')).not.toBe(''))
  it('слишком длинное', () => expect(validateUsername('x'.repeat(51))).not.toBe(''))
})

describe('validateOptionalUrl', () => {
  it('пусто допустимо', () => expect(validateOptionalUrl('')).toBe(''))
  it('https-ссылка', () => expect(validateOptionalUrl('https://example.com/a.png')).toBe(''))
  it('не ссылка', () => expect(validateOptionalUrl('картинка')).not.toBe(''))
  it('небезопасная схема', () => expect(validateOptionalUrl('javascript:alert(1)')).not.toBe(''))
})

describe('validateRating', () => {
  it.each([1, 5, 10])('принимает %i', (v) => expect(validateRating(v)).toBe(''))
  it.each([0, 11, 2.5, -1])('отклоняет %s', (v) => expect(validateRating(v)).not.toBe(''))
})

describe('validateRegister', () => {
  const valid = { username: 'Иван', email: 'ivan@test.com', password: 'Secret123', passwordConfirm: 'Secret123' }
  it('корректные данные — без ошибок', () => expect(validateRegister(valid)).toEqual({}))
  it('находит все ошибки сразу', () => {
    const errors = validateRegister({ username: '', email: 'x', password: '1', passwordConfirm: '2' })
    expect(Object.keys(errors).sort()).toEqual(['email', 'password', 'passwordConfirm', 'username'])
  })
  it('пароли не совпадают', () => {
    expect(validateRegister({ ...valid, passwordConfirm: 'Other123' }).passwordConfirm).toBe('Пароли не совпадают')
  })
})

describe('validateLogin', () => {
  it('корректные данные', () => expect(validateLogin({ email: 'a@b.co', password: 'x' })).toEqual({}))
  it('пустой пароль', () => expect(validateLogin({ email: 'a@b.co', password: '' }).password).toBeTruthy())
})

describe('validateCollection', () => {
  it('минимальные данные', () => expect(validateCollection({ name: 'Моя', description: '', coverUrl: '' })).toEqual({}))
  it('пустое название', () => expect(validateCollection({ name: ' ', description: '', coverUrl: '' }).name).toBeTruthy())
  it('неверная обложка', () => {
    expect(validateCollection({ name: 'A', description: '', coverUrl: 'abc' }).coverUrl).toBeTruthy()
  })
  it('длинное описание', () => {
    expect(validateCollection({ name: 'A', description: 'x'.repeat(1001), coverUrl: '' }).description).toBeTruthy()
  })
})

describe('validatePasswordChange', () => {
  it('корректные данные', () => {
    expect(validatePasswordChange({ currentPassword: 'x', newPassword: 'NewPass123', newPasswordConfirm: 'NewPass123' })).toEqual({})
  })
  it('несовпадение и слабый пароль', () => {
    const errors = validatePasswordChange({ currentPassword: '', newPassword: 'abc', newPasswordConfirm: 'abd' })
    expect(Object.keys(errors).sort()).toEqual(['currentPassword', 'newPassword', 'newPasswordConfirm'])
  })
})

describe('validateReviewText', () => {
  it('нормальный текст', () => expect(validateReviewText('Отлично')).toBe(''))
  it('пустой', () => expect(validateReviewText('   ')).not.toBe(''))
  it('слишком длинный', () => expect(validateReviewText('a'.repeat(5001))).not.toBe(''))
})

describe('validateMovieForm', () => {
  const valid = {
    title: 'Фильм', originalTitle: '', type: 'movie' as const, releaseYear: '2020', duration: '100', country: '',
    ageRating: '', director: '', writers: '', castList: '', description: '', posterUrl: '', backdropUrl: '', genreIds: [],
  }
  it('корректные данные', () => expect(validateMovieForm(valid)).toEqual({}))
  it('год вне диапазона', () => expect(validateMovieForm({ ...valid, releaseYear: '1500' }).releaseYear).toBeTruthy())
  it('год не число', () => expect(validateMovieForm({ ...valid, releaseYear: 'abc' }).releaseYear).toBeTruthy())
  it('пустое название', () => expect(validateMovieForm({ ...valid, title: ' ' }).title).toBeTruthy())
  it('длительность необязательна', () => expect(validateMovieForm({ ...valid, duration: '' })).toEqual({}))
  it('неверная длительность', () => expect(validateMovieForm({ ...valid, duration: '0' }).duration).toBeTruthy())
  it('неверная ссылка на постер', () => expect(validateMovieForm({ ...valid, posterUrl: 'x' }).posterUrl).toBeTruthy())
})

describe('validateImageUrl', () => {
  it('пусто допустимо', () => expect(validateImageUrl('')).toBe(''))
  it('локальный путь', () => expect(validateImageUrl('/posters/dune.svg')).toBe(''))
  it('https-ссылка', () => expect(validateImageUrl('https://example.com/a.jpg')).toBe(''))
  it('адрес без протокола, начинающийся с //', () => expect(validateImageUrl('//evil.com/a.png')).not.toBe(''))
  it('путь с пробелом', () => expect(validateImageUrl('/pos ter.svg')).not.toBe(''))
  it('небезопасная схема', () => expect(validateImageUrl('javascript:alert(1)')).not.toBe(''))
  it('просто имя файла', () => expect(validateImageUrl('dune.svg')).not.toBe(''))
})
