import { useEffect, type ReactNode } from 'react'

type ModalProps = { open: boolean; title: string; onClose: () => void; children: ReactNode }

export function Modal({ open, title, onClose, children }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-card p-6 shadow-2xl"
      >
        <h2 className="mb-4 text-lg font-semibold">{title}</h2>
        {children}
      </div>
    </div>
  )
}

type ConfirmProps = {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Подтвердить', danger = false, busy = false, onConfirm, onCancel }: ConfirmProps) {
  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <p className="text-sm text-muted">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <button onClick={onCancel} className="rounded-lg border border-white/10 px-4 py-2 text-sm hover:border-accent/60">
          Отмена
        </button>
        <button
          onClick={onConfirm}
          disabled={busy}
          className={`rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 ${danger ? 'bg-red-500 text-white hover:bg-red-400' : 'bg-accent text-bg hover:bg-accent-soft'}`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
