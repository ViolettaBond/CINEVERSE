// Проверка полей форм. Каждая функция возвращает текст ошибки или пустую строку.

export type FormErrors<T> = Partial<Record<keyof T, string>>

export function validateEmail(email: string): string {
  const value = email.trim()
  if (!value) return 'Введите email'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Введите корректный email'
  return ''
}

export function validatePassword(password: string): string {
  if (!password) return 'Введите пароль'
  if (password.length < 8) return 'Пароль должен содержать не менее 8 символов'
  if (password.length > 72) return 'Пароль должен содержать не более 72 символов'
  if (!/[A-Za-zА-Яа-я]/.test(password)) return 'Пароль должен содержать хотя бы одну букву'
  if (!/\d/.test(password)) return 'Пароль должен содержать хотя бы одну цифру'
  return ''
}

export function validateUsername(username: string): string {
  const value = username.trim()
  if (value.length < 2) return 'Имя должно содержать не менее 2 символов'
  if (value.length > 50) return 'Имя должно содержать не более 50 символов'
  return ''
}

// Необязательная ссылка: пусто — допустимо
export function validateOptionalUrl(url: string): string {
  const value = url.trim()
  if (!value) return ''
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? '' : 'Ссылка должна начинаться с http:// или https://'
  } catch {
    return 'Введите корректную ссылку'
  }
}

export function validateRating(rating: number): string {
  return Number.isInteger(rating) && rating >= 1 && rating <= 10 ? '' : 'Оценка должна быть от 1 до 10'
}

function clean<T>(errors: FormErrors<T>): FormErrors<T> {
  const result: FormErrors<T> = {}
  for (const key of Object.keys(errors) as (keyof T)[]) {
    if (errors[key]) result[key] = errors[key]
  }
  return result
}

export type RegisterValues = { username: string; email: string; password: string; passwordConfirm: string }

export function validateRegister(values: RegisterValues): FormErrors<RegisterValues> {
  return clean<RegisterValues>({
    username: validateUsername(values.username),
    email: validateEmail(values.email),
    password: validatePassword(values.password),
    passwordConfirm: values.password !== values.passwordConfirm ? 'Пароли не совпадают' : '',
  })
}

export type LoginValues = { email: string; password: string }

export function validateLogin(values: LoginValues): FormErrors<LoginValues> {
  return clean<LoginValues>({
    email: validateEmail(values.email),
    password: values.password ? '' : 'Введите пароль',
  })
}

export type CollectionValues = { name: string; description: string; coverUrl: string }

export function validateCollection(values: CollectionValues): FormErrors<CollectionValues> {
  const name = values.name.trim()
  return clean<CollectionValues>({
    name: !name ? 'Введите название' : name.length > 100 ? 'Название не длиннее 100 символов' : '',
    description: values.description.length > 1000 ? 'Описание не длиннее 1000 символов' : '',
    coverUrl: validateOptionalUrl(values.coverUrl),
  })
}

export type PasswordChangeValues = { currentPassword: string; newPassword: string; newPasswordConfirm: string }

export function validatePasswordChange(values: PasswordChangeValues): FormErrors<PasswordChangeValues> {
  return clean<PasswordChangeValues>({
    currentPassword: values.currentPassword ? '' : 'Введите текущий пароль',
    newPassword: validatePassword(values.newPassword),
    newPasswordConfirm: values.newPassword !== values.newPasswordConfirm ? 'Пароли не совпадают' : '',
  })
}

export function validateReviewText(text: string): string {
  const value = text.trim()
  if (!value) return 'Напишите текст отзыва'
  if (value.length > 5000) return 'Отзыв не длиннее 5000 символов'
  return ''
}

export type MovieFormValues = {
  title: string
  originalTitle: string
  type: 'movie' | 'series'
  releaseYear: string
  duration: string
  country: string
  ageRating: string
  director: string
  writers: string
  castList: string
  description: string
  posterUrl: string
  backdropUrl: string
  genreIds: number[]
}

export function validateMovieForm(values: MovieFormValues): FormErrors<MovieFormValues> {
  const year = Number(values.releaseYear)
  const duration = values.duration ? Number(values.duration) : null
  return clean<MovieFormValues>({
    title: !values.title.trim() ? 'Введите название' : values.title.length > 255 ? 'Название не длиннее 255 символов' : '',
    releaseYear: !Number.isInteger(year) || year < 1888 || year > 2100 ? 'Год выпуска: от 1888 до 2100' : '',
    duration: duration !== null && (!Number.isInteger(duration) || duration < 1 || duration > 1000) ? 'Длительность: от 1 до 1000 минут' : '',
    posterUrl: validateImageUrl(values.posterUrl),
    backdropUrl: validateImageUrl(values.backdropUrl),
  })
}

// Ссылка на изображение: http(s)-адрес или путь на этом сайте вида /posters/dune.svg
export function validateImageUrl(url: string): string {
  const value = url.trim()
  if (!value) return ''
  if (value.startsWith('/') && !value.startsWith('//') && !/\s/.test(value)) return ''
  return validateOptionalUrl(value) ? 'Введите ссылку http(s) или путь вида /posters/name.svg' : ''
}
