// Общие наборы классов Tailwind, чтобы не повторять их в каждом компоненте
export const inputClass =
  'w-full rounded-xl border border-white/10 bg-surface px-3 py-2 text-sm text-text transition placeholder:text-muted hover:border-white/20 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20'
export const buttonPrimary =
  'inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-medium text-bg shadow-lg shadow-accent/20 transition hover:bg-accent-soft hover:shadow-accent/30 active:scale-[0.98] disabled:opacity-50'
export const buttonSecondary =
  'inline-flex items-center justify-center rounded-xl border border-white/10 bg-card px-4 py-2 text-sm text-text transition hover:border-accent/60 hover:bg-card/80 active:scale-[0.98] disabled:opacity-50'
export const buttonDanger =
  'inline-flex items-center justify-center rounded-xl bg-red-500/90 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500 active:scale-[0.98] disabled:opacity-50'
export const cardClass = 'rounded-2xl bg-card p-4 shadow-lg shadow-black/20'
export const labelClass = 'mb-1 block text-sm text-muted'
export const errorTextClass = 'mt-1 text-xs text-red-400'
