import { ErrorState, LoadingState } from '../../components/StateViews'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useFetch } from '../../hooks/useFetch'
import { api, getErrorMessage } from '../../services/api'
import type { AdminUser } from '../../types'
import { formatDate } from '../../utils/format'

export default function AdminUsers() {
  const toast = useToast()
  const { user: me } = useAuth()
  const { data, loading, error, reload } = useFetch(() => api.get<AdminUser[]>('/admin/users').then((r) => r.data), [])

  const patch = async (id: number, body: { status?: string; role?: string }, success: string) => {
    try {
      await api.patch(`/admin/users/${id}`, body)
      toast.success(success)
      reload()
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  if (loading) return <LoadingState />
  if (error) return <ErrorState text={error} onRetry={reload} />
  return (
    <div className="overflow-x-auto rounded-xl bg-card">
      <table className="w-full text-left text-sm">
        <thead className="text-muted">
          <tr>
            <th className="px-4 py-3">Пользователь</th><th className="px-4 py-3">Роль</th><th className="px-4 py-3">Статус</th>
            <th className="px-4 py-3">Отзывов</th><th className="px-4 py-3">Регистрация</th><th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {data?.map((u) => (
            <tr key={u.id}>
              <td className="px-4 py-3"><p>{u.username}</p><p className="text-xs text-muted">{u.email}</p></td>
              <td className="px-4 py-3">{u.role === 'administrator' ? 'Администратор' : 'Пользователь'}</td>
              <td className="px-4 py-3">{u.status === 'blocked' ? <span className="text-red-400">Заблокирован</span> : 'Активен'}</td>
              <td className="px-4 py-3">{u.reviews_count}</td>
              <td className="px-4 py-3">{formatDate(u.created_at)}</td>
              <td className="whitespace-nowrap px-4 py-3 text-right">
                {u.id === me?.id ? <span className="text-xs text-muted">это вы</span> : (
                  <>
                    <button onClick={() => void patch(u.id, { status: u.status === 'blocked' ? 'active' : 'blocked' }, u.status === 'blocked' ? 'Пользователь разблокирован' : 'Пользователь заблокирован')} className="mr-3 text-accent-soft hover:underline">
                      {u.status === 'blocked' ? 'Разблокировать' : 'Заблокировать'}
                    </button>
                    <button onClick={() => void patch(u.id, { role: u.role === 'administrator' ? 'user' : 'administrator' }, 'Роль изменена')} className="text-muted hover:underline">
                      {u.role === 'administrator' ? 'Снять права' : 'Сделать админом'}
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
