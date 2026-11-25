import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, getErrorMessage } from '../services/api'
import type { ListName, Movie } from '../types'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'

type ListIds = Record<ListName, Set<number>>
type ListsApi = {
  has: (list: ListName, movieId: number) => boolean
  toggle: (list: ListName, movieId: number) => Promise<void>
  refresh: () => Promise<void>
}

const empty = (): ListIds => ({ favorites: new Set(), watchlist: new Set(), watched: new Set() })
const ListsContext = createContext<ListsApi | null>(null)

const MESSAGES: Record<ListName, [string, string]> = {
  favorites: ['Добавлено в избранное', 'Удалено из избранного'],
  watchlist: ['Добавлено в «Посмотреть позже»', 'Удалено из «Посмотреть позже»'],
  watched: ['Отмечено как просмотренное', 'Отметка о просмотре снята'],
}

// Хранит номера фильмов в личных списках, чтобы карточки знали своё состояние (сердечко и т.п.)
export function ListsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const toast = useToast()
  const [ids, setIds] = useState<ListIds>(empty)

  const refresh = useCallback(async () => {
    if (!user) {
      setIds(empty())
      return
    }
    try {
      const [favorites, watchlist, watched] = await Promise.all(
        (['favorites', 'watchlist', 'watched'] as const).map((name) => api.get<Movie[]>(`/${name}`)),
      )
      setIds({
        favorites: new Set(favorites.data.map((m) => m.id)),
        watchlist: new Set(watchlist.data.map((m) => m.id)),
        watched: new Set(watched.data.map((m) => m.id)),
      })
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }, [user, toast])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh()
  }, [refresh])

  const toggle = useCallback(
    async (list: ListName, movieId: number) => {
      const present = ids[list].has(movieId)
      try {
        if (present) await api.delete(`/${list}/${movieId}`)
        else await api.post(`/${list}`, { movieId })
        toast.success(MESSAGES[list][present ? 1 : 0])
        await refresh()
      } catch (error) {
        toast.error(getErrorMessage(error))
      }
    },
    [ids, refresh, toast],
  )

  const value = useMemo<ListsApi>(
    () => ({ has: (list, movieId) => ids[list].has(movieId), toggle, refresh }),
    [ids, toggle, refresh],
  )
  return <ListsContext.Provider value={value}>{children}</ListsContext.Provider>
}

export function useLists(): ListsApi {
  const value = useContext(ListsContext)
  if (!value) throw new Error('useLists нужно использовать внутри ListsProvider')
  return value
}
