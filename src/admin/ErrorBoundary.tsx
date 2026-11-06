import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
    children: ReactNode
}

interface State {
    error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
    state: State = { error: null }

    static getDerivedStateFromError(error: Error): State {
        return { error }
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('Błąd w panelu:', error, info.componentStack)
    }

    render() {
        if (this.state.error) {
            return (
                <div className="mx-auto max-w-2xl p-6">
                    <div className="rounded-2xl bg-red-50 p-5 text-red-800">
                        <h2 className="text-lg font-semibold">Coś poszło nie tak</h2>
                        <p className="mt-2 break-words text-sm">{this.state.error.message}</p>
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-red-800 ring-1 ring-red-300 hover:bg-red-100"
                        >
                            Odśwież stronę
                        </button>
                    </div>
                </div>
            )
        }
        return this.props.children
    }
}