import { Outlet, useLocation } from 'react-router'
import AuthProvider from './AuthProvider'
import ErrorBoundary from './ErrorBoundary'

export default function AdminRoot() {
    const { pathname } = useLocation()

    return (
        <AuthProvider>
            {/* key sprawia, że po przejściu na inną stronę panelu komunikat błędu znika */}
            <ErrorBoundary key={pathname}>
                <Outlet />
            </ErrorBoundary>
        </AuthProvider>
    )
}