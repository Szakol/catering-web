import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../auth'

export default function LoginPage() {
    const { authenticated, login } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const from = (location.state as { from?: string } | null)?.from ?? '/admin'

    const [username, setUsername] = useState('admin')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    if (authenticated) {
        return <Navigate to={from} replace />
    }

    async function onSubmit(e: FormEvent) {
        e.preventDefault()
        setSubmitting(true)
        setError(null)
        try {
            await login(username.trim(), password)
            navigate(from, { replace: true })
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Nie udało się zalogować')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-brand-50 px-4">
            <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded-3xl bg-white p-8 shadow-lg">
                <h1 className="text-2xl font-bold text-stone-900">Panel administratora</h1>

                <label className="block">
                    <span className="mb-1 block text-sm font-medium text-stone-700">Login</span>
                    <input
                        className="input"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoComplete="username"
                    />
                </label>

                <label className="block">
                    <span className="mb-1 block text-sm font-medium text-stone-700">Hasło</span>
                    <input
                        className="input"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        autoFocus
                    />
                </label>

                {error && (
                    <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                        {error}
                    </p>
                )}

                <button type="submit" disabled={submitting || password === ''} className="btn-primary w-full">
                    {submitting ? 'Logowanie…' : 'Zaloguj'}
                </button>
            </form>
        </div>
    )
}