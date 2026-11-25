import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, tokenStorage } from '../services/api'
import type { User } from '../types'

type AuthApi = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string, passwordConfirm: string) => Promise<void>
  logout: () => void
  setUser: (user: User | null) => void
}

const AuthContext = createContext<AuthApi | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(Boolean(tokenStorage.get()))

  // При запуске проверяем сохранённый токен
  useEffect(() => {
    if (!tokenStorage.get()) return
    api
      .get<{ user: User }>('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => tokenStorage.clear())
      .finally(() => setLoading(false))
  }, [])

  // Сервер сообщил, что токен недействителен
  useEffect(() => {
    const handler = () => setUser(null)
    window.addEventListener('auth:logout', handler)
    return () => window.removeEventListener('auth:logout', handler)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<{ user: User; token: string }>('/auth/login', { email, password })
    tokenStorage.set(res.data.token)
    setUser(res.data.user)
  }, [])

  const register = useCallback(
    async (username: string, email: string, password: string, passwordConfirm: string) => {
      const res = await api.post<{ user: User; token: string }>('/auth/register', {
        username, email, password, passwordConfirm,
      })
      tokenStorage.set(res.data.token)
      setUser(res.data.user)
    },
    [],
  )

  const logout = useCallback(() => {
    tokenStorage.clear()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, register, logout, setUser }),
    [user, loading, login, register, logout],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthApi {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth нужно использовать внутри AuthProvider')
  return value
}
