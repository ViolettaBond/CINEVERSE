import { Outlet, useLocation } from 'react-router-dom'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'

export default function MainLayout() {
  const { pathname } = useLocation()
  return (
    <div className="min-h-screen md:flex">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <Header />
        {/* key заставляет страницу плавно появляться при каждом переходе */}
        <main key={pathname} className="page-enter mx-auto max-w-7xl p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
