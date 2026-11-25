import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { getErrorMessage } from '../services/api'
import { buttonPrimary, errorTextClass, inputClass, labelClass } from '../styles'
import { validateRegister, type FormErrors, type RegisterValues } from '../utils/validation'

export default function RegisterPage() {
  const { register } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [values, setValues] = useState<RegisterValues>({ username: '', email: '', password: '', passwordConfirm: '' })
  const [errors, setErrors] = useState<FormErrors<RegisterValues>>({})
  const [serverError, setServerError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const found = validateRegister(values)
    setErrors(found)
    setServerError('')
    if (Object.keys(found).length > 0) return

    setBusy(true)
    try {
      await register(values.username.trim(), values.email.trim().toLowerCase(), values.password, values.passwordConfirm)
      toast.success('Аккаунт создан')
      navigate('/')
    } catch (error) {
      setServerError(getErrorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  const field = (key: keyof RegisterValues, label: string, type = 'text', autoComplete?: string) => (
    <div>
      <label htmlFor={key} className={labelClass}>{label}</label>
      <input id={key} type={type} autoComplete={autoComplete} className={inputClass} value={values[key]} onChange={(e) => setValues({ ...values, [key]: e.target.value })} />
      {errors[key] && <p className={errorTextClass}>{errors[key]}</p>}
    </div>
  )

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <h1 className="text-xl font-semibold">Регистрация</h1>
      {field('username', 'Имя пользователя', 'text', 'username')}
      {field('email', 'Email', 'email', 'email')}
      {field('password', 'Пароль', 'password', 'new-password')}
      {field('passwordConfirm', 'Повторите пароль', 'password', 'new-password')}
      {serverError && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300" role="alert">{serverError}</p>}
      <button type="submit" disabled={busy} className={`${buttonPrimary} w-full`}>
        {busy ? 'Создаём…' : 'Зарегистрироваться'}
      </button>
      <p className="text-center text-sm text-muted">
        Уже есть аккаунт? <Link to="/login" className="text-accent-soft hover:underline">Войти</Link>
      </p>
    </form>
  )
}
