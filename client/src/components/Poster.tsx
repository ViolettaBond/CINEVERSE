import { useState } from 'react'

type Props = { title: string; url: string | null; className?: string }

// Постер фильма. Пока картинка грузится — мягкая заглушка-«скелетон».
// Если картинки нет или она не загрузилась — градиент с названием, а не пустой блок.
export default function Poster({ title, url, className = '' }: Props) {
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)

  if (!url || failed) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-card via-surface to-accent/30 p-3 text-center text-sm font-semibold text-accent-soft ${className}`}
        role="img"
        aria-label={title}
      >
        {title}
      </div>
    )
  }
  return (
    <img
      src={url}
      alt={title}
      loading="lazy"
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
      className={`object-cover ${loaded ? '' : 'animate-pulse bg-card'} ${className}`}
    />
  )
}
