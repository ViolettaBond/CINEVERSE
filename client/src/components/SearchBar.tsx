import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { SearchIcon } from './icons'

export default function SearchBar() {
  const [value, setValue] = useState('')
  const navigate = useNavigate()

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const query = value.trim()
    navigate(query ? `/catalog?q=${encodeURIComponent(query)}` : '/catalog')
  }

  return (
    <form onSubmit={submit} role="search" className="relative w-full max-w-md">
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label="Поиск фильмов"
        placeholder="Найти фильм или сериал"
        className="w-full rounded-full border border-white/10 bg-surface py-2 pl-9 pr-4 text-sm placeholder:text-muted focus:border-accent focus:outline-none"
      />
    </form>
  )
}
