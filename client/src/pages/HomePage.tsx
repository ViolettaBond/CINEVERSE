import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import MovieGrid from '../components/MovieGrid'
import Poster from '../components/Poster'
import { ErrorState, LoadingState } from '../components/StateViews'
import { useAuth } from '../context/AuthContext'
import { useFetch } from '../hooks/useFetch'
import { api } from '../services/api'
import { buttonPrimary, buttonSecondary } from '../styles'
import type { Movie, MovieDetails, Paginated } from '../types'
import { formatDuration, formatRating } from '../utils/format'
import { pickRecommendations, topGenreIds } from '../utils/movies'

const getMovies = (params: Record<string, string | number>) =>
  api.get<Paginated<Movie>>('/movies', { params }).then((r) => r.data.items)

async function loadHome() {
  const [popular, fresh, series, favorites, watched] = await Promise.all([
    getMovies({ type: 'movie', sort: 'rating', order: 'desc', limit: 6 }),
    getMovies({ sort: 'year', order: 'desc', limit: 6 }),
    getMovies({ type: 'series', sort: 'rating', order: 'desc', limit: 6 }),
    api.get<Movie[]>('/favorites').then((r) => r.data),
    api.get<Movie[]>('/watched', { params: { sort: 'added', order: 'desc' } }).then((r) => r.data),
  ])

  // Баннер — самый популярный фильм с подробным описанием
  const featured = popular[0] ? (await api.get<MovieDetails>(`/movies/${popular[0].id}`)).data : null

  // Рекомендации: лучшие фильмы любимых жанров, которых ещё нет в личных списках
  const likedGenres = topGenreIds([...favorites, ...watched], 2)
  const candidates = await getMovies({
    ...(likedGenres.length > 0 ? { genre: likedGenres.join(',') } : {}),
    sort: 'rating',
    order: 'desc',
    limit: 24,
  })
  const known = new Set([...favorites, ...watched].map((m) => m.id))
  const recommendations = pickRecommendations(candidates, known, 6)

  return { featured, popular, fresh, series, recommendations, recent: watched.slice(0, 6), hasLiked: likedGenres.length > 0 }
}

function Section({ title, link, children }: { title: string; link?: { to: string; label: string }; children: ReactNode }) {
  return (
    <section className="mt-10">
      <div className="mb-4 flex items-end justify-between">
        <h2 className="flex items-center gap-3 text-xl font-semibold">
          <span className="h-6 w-1 rounded-full bg-gradient-to-b from-accent to-cool" />
          {title}
        </h2>
        {link && <Link to={link.to} className="text-sm text-accent-soft transition hover:text-text">{link.label} →</Link>}
      </div>
      {children}
    </section>
  )
}

export default function HomePage() {
  const { user } = useAuth()
  const { data, loading, error, reload } = useFetch(loadHome, [])

  if (loading) return <LoadingState />
  if (error || !data) return <ErrorState text={error || 'Не удалось загрузить данные'} onRetry={reload} />

  const { featured } = data
  return (
    <div>
      {featured && (
        <section className="relative overflow-hidden rounded-3xl bg-card shadow-2xl shadow-black/40 ring-1 ring-white/5">
          {featured.backdrop_url && (
            <img src={featured.backdrop_url} alt="" className="absolute inset-0 h-full w-full scale-105 object-cover opacity-60" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/75 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg/80 via-transparent to-transparent" />
          <div className="relative flex flex-col gap-6 p-6 md:min-h-[380px] md:flex-row md:items-center md:gap-10 md:p-12">
            <Poster title={featured.title} url={featured.poster_url} className="hidden h-72 w-48 shrink-0 rounded-2xl shadow-2xl shadow-black/60 ring-1 ring-white/10 md:block" />
            <div className="max-w-2xl">
              <span className="inline-block rounded-full bg-accent/20 px-3 py-1 text-xs font-medium uppercase tracking-wider text-accent-soft">Рекомендуем сегодня</span>
              <h1 className="mt-3 text-3xl font-extrabold leading-tight md:text-5xl">{featured.title}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                <span className="rounded-md bg-black/40 px-2 py-0.5 font-semibold text-accent-soft">★ {formatRating(featured.rating)}</span>
                <span>{featured.release_year}</span>
                <span>{formatDuration(featured.duration)}</span>
                <span>{featured.genres.map((g) => g.name).join(', ')}</span>
              </div>
              <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-text/90 md:text-base">{featured.description}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to={`/movie/${featured.id}`} className={buttonPrimary}>Подробнее</Link>
                <Link to="/collection" className={buttonSecondary}>Моя коллекция</Link>
              </div>
            </div>
          </div>
        </section>
      )}

      <Section title="Популярные фильмы" link={{ to: '/catalog?type=movie&sort=rating&order=desc', label: 'Все фильмы' }}>
        <MovieGrid movies={data.popular} variant="row" />
      </Section>
      <Section title="Новинки" link={{ to: '/catalog?sort=year&order=desc', label: 'Весь каталог' }}>
        <MovieGrid movies={data.fresh} variant="row" />
      </Section>
      <Section title="Популярные сериалы" link={{ to: '/catalog?type=series&sort=rating&order=desc', label: 'Все сериалы' }}>
        <MovieGrid movies={data.series} variant="row" />
      </Section>
      {user && (
        <Section title={data.hasLiked ? 'Рекомендации для вас' : 'Лучшее по оценкам зрителей'}>
          {data.hasLiked || data.recommendations.length > 0 ? (
            <MovieGrid movies={data.recommendations} variant="row" />
          ) : null}
          {!data.hasLiked && <p className="mt-3 text-sm text-muted">Добавляйте фильмы в избранное — подборка станет персональной.</p>}
        </Section>
      )}
      {data.recent.length > 0 && (
        <Section title="Недавно просмотренное" link={{ to: '/collection', label: 'Моя коллекция' }}>
          <MovieGrid movies={data.recent} variant="row" />
        </Section>
      )}
    </div>
  )
}
