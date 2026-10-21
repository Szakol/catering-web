import { Link } from 'react-router'

export default function NotFoundPage() {
    return (
        <div className="mx-auto max-w-xl px-4 py-24 text-center">
            <h1 className="text-4xl font-bold text-stone-900">Nie ma takiej strony</h1>
            <p className="mt-3 text-stone-600">Sprawdź adres albo wróć do strony głównej.</p>
            <Link to="/" className="mt-6 inline-block rounded-2xl bg-amber-500 px-5 py-3 font-semibold text-white">
                Strona główna
            </Link>
        </div>
    )
}