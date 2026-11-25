import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LoadingState } from './StateViews'

// Пускает только вошедших пользователей
export function ProtectedRoute() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingState />
  return user ? <Outlet /> : <Navigate to="/login" replace />
}

// Страницы входа и регистрации для уже вошедшего пользователя не нужны
export function GuestRoute() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingState />
  return user ? <Navigate to="/" replace /> : <Outlet />
}

// Скрывает админку от обычных пользователей. Настоящая защита — проверка роли на сервере
export function AdminRoute() {
  const { user } = useAuth()
  return user?.role === 'administrator' ? <Outlet /> : <Navigate to="/" replace />
}
