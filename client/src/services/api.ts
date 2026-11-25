import axios, { isAxiosError } from 'axios'

const TOKEN_KEY = 'cineverse_token'

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

export const api = axios.create({ baseURL: '/api' })

// Токен добавляется ко всем запросам автоматически
api.interceptors.request.use((config) => {
  const token = tokenStorage.get()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Если токен перестал действовать, сообщаем приложению, чтобы оно разлогинило пользователя
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url: string = error.config?.url ?? ''
    if (isAxiosError(error) && error.response?.status === 401 && !url.startsWith('/auth/')) {
      tokenStorage.clear()
      window.dispatchEvent(new Event('auth:logout'))
    }
    return Promise.reject(error)
  },
)

// Текст ошибки для пользователя: сообщение сервера или понятная замена
export function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const message = (error.response?.data as { message?: string } | undefined)?.message
    if (message) return message
    return error.response ? 'Произошла ошибка на сервере' : 'Нет связи с сервером'
  }
  return 'Произошла неизвестная ошибка'
}
