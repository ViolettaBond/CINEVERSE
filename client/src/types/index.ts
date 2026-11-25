export type Genre = { id: number; name: string }

export type Movie = {
  id: number
  title: string
  original_title: string | null
  release_year: number
  type: 'movie' | 'series'
  age_rating: string | null
  country: string | null
  poster_url: string | null
  genres: Genre[]
  rating: number | null
  ratings_count: number
  added_at?: string
}

export type MovieDetails = Movie & {
  description: string | null
  duration: number | null
  backdrop_url: string | null
  director: string | null
  writers: string | null
  cast_list: string | null
  similar: Movie[]
}

export type Paginated<T> = {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export type User = {
  id: number
  username: string
  email: string
  role: 'user' | 'administrator'
  avatar: string | null
  notify_reviews: boolean
  notify_collections: boolean
  created_at: string
}

export type Collection = {
  id: number
  name: string
  description: string | null
  cover_url: string | null
  created_at: string
  movies_count: number
}

export type CollectionDetails = Omit<Collection, 'movies_count'> & { movies: Movie[] }

export type RatingInfo = { average: number | null; count: number; userRating: number | null }

export type Review = {
  id: number
  user_id: number
  movie_id: number
  text: string
  created_at: string
  updated_at: string
  username: string
  avatar: string | null
  rating: number | null
}

export type MyReview = {
  id: number
  movie_id: number
  text: string
  created_at: string
  updated_at: string
  movie_title: string
  poster_url: string | null
  rating: number | null
}

export type AppNotification = {
  id: number
  type: 'system' | 'collection' | 'review'
  title: string
  message: string
  link: string | null
  is_read: boolean
  created_at: string
}

export type UserStats = {
  watchedMovies: number
  watchedSeries: number
  reviewsCount: number
  collectionsCount: number
  favoriteGenres: string[]
  lastActivity: string | null
}

export type AdminUser = {
  id: number
  username: string
  email: string
  role: 'user' | 'administrator'
  status: 'active' | 'blocked'
  created_at: string
  reviews_count: number
}

export type AdminReview = {
  id: number
  text: string
  created_at: string
  username: string
  movie_title: string
  movie_id: number
}

export type AdminStats = {
  users: number
  movies: number
  series: number
  genres: number
  reviews: number
  ratings: number
  collections: number
  topFavorites: { id: number; title: string; favorites_count: number }[]
}

export type ListName = 'favorites' | 'watchlist' | 'watched'
