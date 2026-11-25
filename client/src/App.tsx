import { Route, Routes } from 'react-router-dom'
import { AdminRoute, GuestRoute, ProtectedRoute } from './components/RouteGuards'
import AuthLayout from './layouts/AuthLayout'
import MainLayout from './layouts/MainLayout'
import AdminPage from './pages/AdminPage'
import CatalogPage from './pages/CatalogPage'
import CollectionPage from './pages/CollectionPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import MoviePage from './pages/MoviePage'
import NotificationsPage from './pages/NotificationsPage'
import PlaylistDetailPage from './pages/PlaylistDetailPage'
import PlaylistsPage from './pages/PlaylistsPage'
import ProfilePage from './pages/ProfilePage'
import RegisterPage from './pages/RegisterPage'
import ReviewsPage from './pages/ReviewsPage'
import SettingsPage from './pages/SettingsPage'
import { EmptyState } from './components/StateViews'

export default function App() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/movie/:id" element={<MoviePage />} />
          <Route path="/collection" element={<CollectionPage />} />
          <Route path="/playlists" element={<PlaylistsPage />} />
          <Route path="/playlists/:id" element={<PlaylistDetailPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminPage />} />
          </Route>
          <Route path="*" element={<EmptyState title="Страница не найдена" text="Проверьте адрес или вернитесь на главную." />} />
        </Route>
      </Route>
    </Routes>
  )
}
