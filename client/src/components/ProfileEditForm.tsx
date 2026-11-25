import { useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { api, getErrorMessage } from '../services/api'
import { buttonPrimary, errorTextClass, inputClass, labelClass } from '../styles'
import type { User } from '../types'
import { validateOptionalUrl, validateUsername } from '../utils/validation'

// Форма изменения имени и аватара (используется на страницах «Профиль» и «Настройки»)
export default function ProfileEditForm({ onSaved }: { onSaved?: () => void }) {
  const { user, setUser } = useAuth()
  const toast = useToast()
  const [username, setUsername] = useState(user?.username ?? '')
  const [avatar, setAvatar] = useState(user?.avatar ?? '')
  const [errors, setErrors] = useState<{ username?: string; avatar?: string }>({})
  const [busy, setBusy] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const found = { username: validateUsername(username), avatar: validateOptionalUrl(avatar) }
    setErrors(found)
    if (found.username || found.avatar) return

    setBusy(true)
    try {
      const res = await api.put<{ user: User }>('/users/me', { username: username.trim(), avatar: avatar.trim() })
      setUser(res.data.user)
      toast.success('Профиль сохранён')
      onSaved?.()
    } catch (e) {
      toast.error(getErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-3">
      <div>
        <label htmlFor="pe-name" className={labelClass}>Имя пользователя</label>
        <input id="pe-name" className={inputClass} value={username} onChange={(e) => setUsername(e.target.value)} />
        {errors.username && <p className={errorTextClass}>{errors.username}</p>}
      </div>
      <div>
        <label htmlFor="pe-avatar" className={labelClass}>Ссылка на аватар (необязательно)</label>
        <input id="pe-avatar" className={inputClass} placeholder="https://…" value={avatar} onChange={(e) => setAvatar(e.target.value)} />
        {errors.avatar && <p className={errorTextClass}>{errors.avatar}</p>}
      </div>
      <button type="submit" disabled={busy} className={buttonPrimary}>Сохранить</button>
    </form>
  )
}
