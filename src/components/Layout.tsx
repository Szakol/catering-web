import { useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { useCart } from '../cart/cart'
import { site } from '../content'

const navClass = ({ isActive }: { isActive: boolean }) =>
    [
        'rounded-lg px-3 py-2 text-sm font-medium transition',
        isActive ? 'bg-brand-200 text-brand-900' : 'text-stone-600 hover:text-stone-900',
    ].join(' ')

function ScrollToTop() {
    const { pathname } = useLocation()
    useEffect(() => {
        window.scrollTo(0, 0)
    }, [pathname])
    return null
}

export default function Layout() {
    const { count } = useCart()

    return (
        <div className="flex min-h-screen flex-col bg-brand-50 text-stone-800">
            <ScrollToTop />

            <header className="sticky top-0 z-10 border-b border-brand-200 bg-white/90 backdrop-blur">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
                    <Link to="/" className="text-xl font-bold text-brand-700">
                        {site.name}
                    </Link>
                    <nav className="flex items-center gap-1">
                        <NavLink to="/" end className={navClass}>
                            Start
                        </NavLink>
                        <NavLink to="/zamow" className={navClass}>
                            Zamów
                        </NavLink>
                        <NavLink to="/koszyk" className={navClass}>
                            Koszyk
                            {count > 0 && (
                                <span className="ml-1.5 rounded-full bg-brand-600 px-2 py-0.5 text-xs font-bold text-white">
                  {count}
                </span>
                            )}
                        </NavLink>
                    </nav>
                </div>
            </header>

            <main className="flex-1">
                <Outlet />
            </main>

            <footer className="border-t border-brand-200 bg-white">
                <div className="mx-auto grid max-w-6xl gap-4 px-4 py-8 text-sm text-stone-600 sm:grid-cols-2">
                    <div>
                        <p className="font-semibold text-brand-700">{site.name}</p>
                        <p>{site.tagline}</p>
                    </div>
                    <div className="sm:text-right">
                        <p>{site.contact.city}</p>
                        <p>{site.contact.phone}</p>
                        <p>{site.contact.email}</p>
                    </div>
                </div>
            </footer>
        </div>
    )
}