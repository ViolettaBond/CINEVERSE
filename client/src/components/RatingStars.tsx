import { useState } from 'react'
import { StarIcon } from './icons'

type Props = { value: number | null; onChange?: (rating: number) => void; disabled?: boolean }

// Оценка от 1 до 10. Без onChange компонент только показывает значение
export default function RatingStars({ value, onChange, disabled = false }: Props) {
  const [hover, setHover] = useState(0)
  const active = hover || value || 0
  const interactive = Boolean(onChange) && !disabled

  return (
    <div className="flex flex-wrap items-center gap-0.5" role={interactive ? 'radiogroup' : 'img'} aria-label={`Оценка: ${value ?? 'нет'}`}>
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          disabled={!interactive}
          aria-label={`Оценка ${n}`}
          onClick={() => onChange?.(n)}
          onMouseEnter={() => interactive && setHover(n)}
          onMouseLeave={() => setHover(0)}
          className={`${n <= active ? 'text-accent' : 'text-white/20'} ${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition`}
        >
          <StarIcon className="h-5 w-5" filled={n <= active} />
        </button>
      ))}
    </div>
  )
}
