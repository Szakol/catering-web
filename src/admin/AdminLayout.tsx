import { useEffect } from 'react'
import { Link, Navigate, NavLink, Outlet, useLocation } from 'react-router'
import { site } from '../content'
import { useAuth } from './auth'

const navClass = ({ isActive }: { isActive: boolean }) =>
    [
        'rounded-lg px-3 py-2 text-sm font-medium transition',
        isActive ? 'bg-brand-200 text-brand-900' : 'text-stone-600 hover:text-stone-900',
    ].join(' ')

export default function AdminLayout() {
    const { authenticated, logout } = useAuth()
    const location = useLocation()

    // panel nie powinien trafiać do wyszukiwarek
    useEffect(() => {
        const meta = document.createElement('meta')
        meta.name = 'robots'
        meta.content = 'noindex'
        document.head.appendChild(meta)
        const previousTitle = document.title
        document.title = `Panel | ${site.name}`
        return () => {
            document.head.removeChild(meta)
            document.title = previousTitle
        }
    }, [])

    if (!authenticated) {
        return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
    }

    return (
        <div className="min-h-screen bg-stone-100 text-stone-800">
            <header className="border-b border-stone-200 bg-white">
                <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-3">
                    <div className="flex flex-wrap items-center gap-4">
                        <span className="text-lg font-bold text-brand-700">Panel: {site.name}</span>
                        <nav className="flex flex-wrap items-center gap-1">
                            <NavLink to="/admin" end className={navClass}>
                                Zamówienia
                            </NavLink>
                            <NavLink to="/admin/zamowienia/nowe" className={navClass}>
                                Nowe zamówienie
                            </NavLink>
                            <NavLink to="/admin/menu" className={navClass}>
                                Menu
                            </NavLink>
                            <NavLink to="/admin/produkty" className={navClass}>
                                Produkty
                            </NavLink>
                            <NavLink to="/admin/statystyki" className={navClass}>
                                Statystyki
                            </NavLink>
                            <NavLink to="/admin/ustawienia" className={navClass}>
                                Ustawienia
                            </NavLink>
                        </nav>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                        <Link to="/" className="text-stone-500 hover:text-stone-800">
                            Strona sklepu
                        </Link>
                        <button type="button" onClick={logout} className="rounded-lg border border-stone-300 px-3 py-1.5 hover:bg-stone-50">
                            Wyloguj
                        </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-4 py-6">
                <Outlet />
            </main>
        </div>
    )
}