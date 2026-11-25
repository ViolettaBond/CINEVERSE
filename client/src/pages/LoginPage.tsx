import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { getErrorMessage } from '../services/api'
import { buttonPrimary, errorTextClass, inputClass, labelClass } from '../styles'
import { validateLogin, type FormErrors, type LoginValues } from '../utils/validation'

export default function LoginPage() {
  const { login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [values, setValues] = useState<LoginValues>({ email: '', password: '' })
  const [errors, setErrors] = useState<FormErrors<LoginValues>>({})
  const [serverError, setServerError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const found = validateLogin(values)
    setErrors(found)
    setServerError('')
    if (Object.keys(found).length > 0) return

    setBusy(true)
    try {
      await login(values.email.trim().toLowerCase(), values.password)
      toast.success('Вы вошли в аккаунт')
      navigate('/')
    } catch (error) {
      setServerError(getErrorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <h1 className="text-xl font-semibold">Вход</h1>
      <div>
        <label htmlFor="email" className={labelClass}>Email</label>
        <input id="email" type="email" autoComplete="email" className={inputClass} value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} />
        {errors.email && <p className={errorTextClass}>{errors.email}</p>}
      </div>
      <div>
        <label htmlFor="password" className={labelClass}>Пароль</label>
        <input id="password" type="password" autoComplete="current-password" className={inputClass} value={values.password} onChange={(e) => setValues({ ...values, password: e.target.value })} />
        {errors.password && <p className={errorTextClass}>{errors.password}</p>}
      </div>
      {serverError && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300" role="alert">{serverError}</p>}
      <button type="submit" disabled={busy} className={`${buttonPrimary} w-full`}>
        {busy ? 'Входим…' : 'Войти'}
      </button>
      <p className="text-center text-sm text-muted">
        Нет аккаунта? <Link to="/register" className="text-accent-soft hover:underline">Зарегистрироваться</Link>
      </p>
    </form>
  )
}
