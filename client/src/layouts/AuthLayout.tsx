import { Outlet } from 'react-router-dom'

// Декоративные постеры на фоне страниц входа и регистрации
const BACKDROP = ['inception', 'dune', 'arcane', 'matrix', 'game-of-thrones', 'interstellar']

export default function AuthLayout() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="pointer-events-none absolute inset-0 grid -rotate-6 scale-125 grid-cols-3 gap-4 opacity-25 sm:grid-cols-6" aria-hidden="true">
        {BACKDROP.map((slug) => (
          <img key={slug} src={`/posters/${slug}.svg`} alt="" className="aspect-[2/3] w-full rounded-2xl object-cover" />
        ))}
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-bg/70 via-bg/85 to-bg" />
      <div className="page-enter relative w-full max-w-md rounded-3xl border border-white/10 bg-card/90 p-8 shadow-2xl shadow-black/50 backdrop-blur-xl">
        <div className="mb-6 flex items-center justify-center gap-2">
          <span className="h-3 w-3 rounded-full bg-gradient-to-br from-accent to-cool shadow-lg shadow-accent/40" />
          <span className="bg-gradient-to-r from-accent-soft to-cool bg-clip-text text-2xl font-extrabold tracking-wide text-transparent">Cineverse</span>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
