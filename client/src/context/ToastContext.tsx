import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

type Toast = { id: number; type: 'success' | 'error'; text: string }
type ToastApi = { success: (text: string) => void; error: (text: string) => void }

const ToastContext = createContext<ToastApi | null>(null)
let nextId = 1

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const push = useCallback((type: Toast['type'], text: string) => {
    const id = nextId++
    setToasts((list) => [...list, { id, type, text }])
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 3500)
  }, [])

  const api = useMemo<ToastApi>(
    () => ({ success: (text) => push('success', text), error: (text) => push('error', text) }),
    [push],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed right-4 top-4 z-[60] flex w-72 flex-col gap-2" aria-live="polite">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`rounded-lg px-4 py-3 text-sm shadow-lg ${
              toast.type === 'success' ? 'bg-emerald-600/90 text-white' : 'bg-red-600/90 text-white'
            }`}
          >
            {toast.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const value = useContext(ToastContext)
  if (!value) throw new Error('useToast нужно использовать внутри ToastProvider')
  return value
}
