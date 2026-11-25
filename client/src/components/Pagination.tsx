import { getPageNumbers } from '../utils/catalog'

type Props = { page: number; totalPages: number; onChange: (page: number) => void }

export default function Pagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null
  const btn = 'min-w-9 rounded-lg px-3 py-1.5 text-sm transition disabled:opacity-40'

  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-1" aria-label="Страницы">
      <button className={`${btn} bg-card hover:bg-surface`} disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Назад
      </button>
      {getPageNumbers(page, totalPages).map((item, index) =>
        item === '…' ? (
          <span key={`gap-${index}`} className="px-1 text-muted">…</span>
        ) : (
          <button
            key={item}
            onClick={() => onChange(item)}
            aria-current={item === page ? 'page' : undefined}
            className={`${btn} ${item === page ? 'bg-accent text-bg' : 'bg-card hover:bg-surface'}`}
          >
            {item}
          </button>
        ),
      )}
      <button className={`${btn} bg-card hover:bg-surface`} disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Вперёд
      </button>
    </nav>
  )
}
