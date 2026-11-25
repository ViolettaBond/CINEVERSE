import { useCallback, useEffect, useState } from 'react'
import { getErrorMessage } from '../services/api'

// Загружает данные при открытии страницы и при изменении deps.
// Возвращает состояния «загрузка», «ошибка» и функцию повторной загрузки.
export function useFetch<T>(fetcher: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    fetcher()
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch((e) => {
        if (!cancelled) setError(getErrorMessage(e))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { data, loading, error, reload, setData }
}
