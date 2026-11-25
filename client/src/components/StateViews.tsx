import type { ReactNode } from 'react'

export function LoadingState({ text = 'Загрузка…' }: { text?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-muted" role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      {text}
    </div>
  )
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 px-4 py-12 text-center">
      <p className="text-lg font-medium">{title}</p>
      {text && <p className="mt-1 text-sm text-muted">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function ErrorState({ text, onRetry }: { text: string; onRetry?: () => void }) {
  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-6 text-center" role="alert">
      <p className="text-red-300">{text}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-3 text-sm text-accent-soft underline">
          Повторить
        </button>
      )}
    </div>
  )
}
