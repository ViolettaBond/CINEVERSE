import type { ReactNode } from 'react'
import { formatDate, initials } from '../utils/format'
import { StarIcon } from './icons'

type Props = {
  author: string
  avatar?: string | null
  rating: number | null
  text: string
  date: string
  edited?: boolean
  actions?: ReactNode
}

export default function ReviewCard({ author, avatar, rating, text, date, edited, actions }: Props) {
  return (
    <article className="rounded-xl bg-card p-4">
      <header className="flex items-center gap-3">
        {avatar ? (
          <img src={avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/20 text-sm font-semibold text-accent-soft">
            {initials(author)}
          </span>
        )}
        <div className="flex-1">
          <p className="text-sm font-medium">{author}</p>
          <p className="text-xs text-muted">
            {formatDate(date)}
            {edited && ' · изменён'}
          </p>
        </div>
        {rating !== null && (
          <span className="flex items-center gap-1 text-sm text-accent-soft">
            <StarIcon className="h-4 w-4" filled /> {rating}/10
          </span>
        )}
      </header>
      <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">{text}</p>
      {actions && <div className="mt-3 flex gap-3">{actions}</div>}
    </article>
  )
}
