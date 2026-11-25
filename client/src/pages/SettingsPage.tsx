import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConfirmDialog, Modal } from '../components/Modal'
import ProfileEditForm from '../components/ProfileEditForm'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { api, getErrorMessage } from '../services/api'
import { buttonDanger, buttonPrimary, buttonSecondary, errorTextClass, inputClass, labelClass } from '../styles'
import type { User } from '../types'
import { validatePasswordChange, type FormErrors, type PasswordChangeValues } from '../utils/validation'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl bg-card p-5">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  )
}

function PasswordForm() {
  const toast = useToast()
  const empty: PasswordChangeValues = { currentPassword: '', newPassword: '', newPasswordConfirm: '' }
  const [values, setValues] = useState(empty)
  const [errors, setErrors] = useState<FormErrors<PasswordChangeValues>>({})
  const [confirming, setConfirming] = useState(false)

  const check = (event: FormEvent) => {
    event.preventDefault()
    const found = validatePasswordChange(values)
    setErrors(found)
    if (Object.keys(found).length === 0) setConfirming(true)
  }

  const save = async () => {
    try {
      await api.put('/users/me/password', values)
      toast.success('Пароль изменён')
      setValues(empty)
    } catch (e) {
      toast.error(getErrorMessage(e))
    } finally {
      setConfirming(false)
    }
  }

  const field = (key: keyof PasswordChangeValues, label: string, autoComplete: string) => (
    <div>
      <label htmlFor={key} className={labelClass}>{label}</label>
      <input id={key} type="password" autoComplete={autoComplete} className={inputClass} value={values[key]} onChange={(e) => setValues({ ...values, [key]: e.target.value })} />
      {errors[key] && <p className={errorTextClass}>{errors[key]}</p>}
    </div>
  )

  return (
    <form onSubmit={check} noValidate className="space-y-3">
      {field('currentPassword', 'Текущий пароль', 'current-password')}
      {field('newPassword', 'Новый пароль', 'new-password')}
      {field('newPasswordConfirm', 'Повторите новый пароль', 'new-password')}
      <button type="submit" className={buttonPrimary}>Изменить пароль</button>
      <ConfirmDialog open={confirming} title="Изменить пароль?" message="После смены пароля войти со старым паролем будет нельзя." confirmLabel="Изменить" onConfirm={() => void save()} onCancel={() => setConfirming(false)} />
    </form>
  )
}

export default function SettingsPage() {
  const { user, setUser, logout } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [deleting, setDeleting] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [loggingOut, setLoggingOut] = useState(false)

  if (!user) return null

  const saveNotifications = async (patch: Partial<Pick<User, 'notify_reviews' | 'notify_collections'>>) => {
    try {
      const res = await api.put<{ user: User }>('/users/me/settings', {
        notifyReviews: patch.notify_reviews ?? user.notify_reviews,
        notifyCollections: patch.notify_collections ?? user.notify_collections,
      })
      setUser(res.data.user)
      toast.success('Настройки сохранены')
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  const deleteAccount = async (event: FormEvent) => {
    event.preventDefault()
    if (!deletePassword) {
      setDeleteError('Введите пароль для подтверждения')
      return
    }
    try {
      await api.delete('/users/me', { data: { password: deletePassword } })
      logout()
      toast.success('Аккаунт удалён')
      navigate('/login')
    } catch (e) {
      setDeleteError(getErrorMessage(e))
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Настройки</h1>
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Section title="Профиль"><ProfileEditForm /></Section>
        <Section title="Пароль"><PasswordForm /></Section>

        <Section title="Уведомления">
          <label className="flex items-center justify-between gap-3 py-2">
            <span className="text-sm">Об отзывах</span>
            <input type="checkbox" className="h-5 w-5 accent-[#A78BFA]" checked={user.notify_reviews} onChange={(e) => void saveNotifications({ notify_reviews: e.target.checked })} />
          </label>
          <label className="flex items-center justify-between gap-3 py-2">
            <span className="text-sm">О подборках</span>
            <input type="checkbox" className="h-5 w-5 accent-[#A78BFA]" checked={user.notify_collections} onChange={(e) => void saveNotifications({ notify_collections: e.target.checked })} />
          </label>
          <p className="mt-2 text-xs text-muted">Системные уведомления приходят всегда.</p>
        </Section>

        <Section title="Аккаунт">
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setLoggingOut(true)} className={buttonSecondary}>Выйти из аккаунта</button>
            <button onClick={() => { setDeleting(true); setDeletePassword(''); setDeleteError('') }} className={buttonDanger}>Удалить аккаунт</button>
          </div>
          <p className="mt-3 text-xs text-muted">Удаление аккаунта необратимо: пропадут коллекции, оценки и отзывы.</p>
        </Section>
      </div>

      <ConfirmDialog open={loggingOut} title="Выйти из аккаунта?" message="Для входа понадобится ввести email и пароль." confirmLabel="Выйти" onConfirm={() => { logout(); navigate('/login') }} onCancel={() => setLoggingOut(false)} />
      <Modal open={deleting} title="Удалить аккаунт?" onClose={() => setDeleting(false)}>
        <form onSubmit={deleteAccount} noValidate className="space-y-3">
          <p className="text-sm text-muted">Все ваши данные будут удалены без возможности восстановления. Введите пароль, чтобы подтвердить.</p>
          <input type="password" aria-label="Пароль для подтверждения" autoComplete="current-password" className={inputClass} value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} />
          {deleteError && <p className={errorTextClass} role="alert">{deleteError}</p>}
          <div className="flex justify-end gap-3">
            <button type="button" className={buttonSecondary} onClick={() => setDeleting(false)}>Отмена</button>
            <button type="submit" className={buttonDanger}>Удалить навсегда</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
