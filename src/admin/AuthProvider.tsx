import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { adminApi, clearToken, getToken, saveToken, subscribeUnauthorized, UnauthorizedError } from './adminApi'
import { AuthContext, type AuthContextValue } from './auth'

/** Login:hasło zakodowane w UTF-8 i base64 (format Basic Auth). */
function encodeBasic(username: string, password: string): string {
    const bytes = new TextEncoder().encode(`${username}:${password}`)
    let binary = ''
    bytes.forEach((b) => {
        binary += String.fromCharCode(b)
    })
    return btoa(binary)
}

export default function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(getToken)

    // 401 z dowolnego zapytania wylogowuje użytkownika
    useEffect(() => subscribeUnauthorized(() => setToken(null)), [])

    const value = useMemo<AuthContextValue>(
        () => ({
            authenticated: token !== null,
            login: async (username, password) => {
                const candidate = encodeBasic(username, password)
                try {
                    await adminApi.verify(candidate)
                } catch (e) {
                    if (e instanceof UnauthorizedError) {
                        throw new Error('Nieprawidłowy login lub hasło')
                    }
                    throw e
                }
                saveToken(candidate)
                setToken(candidate)
            },
            logout: () => {
                clearToken()
                setToken(null)
            },
        }),
        [token],
    )

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}