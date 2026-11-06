import { useEffect, useState, type FormEvent } from 'react'
import { adminApi, UnauthorizedError } from '../adminApi'
import { formatPercent, parseDecimal, round2 } from '../formUtils'
import { formatPrice } from '../../utils/format'

export default function SettingsPage() {
    const [value, setValue] = useState('')
    const [saved, setSaved] = useState<number | null>(null)
    const [loaded, setLoaded] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [message, setMessage] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        let cancelled = false
        adminApi
            .getPricingSettings()
            .then((s) => {
                if (!cancelled) {
                    setValue(String(s.defaultMarginPercent))
                    setSaved(s.defaultMarginPercent)
                    setLoaded(true)
                }
            })
            .catch((e: Error) => {
                if (!cancelled && !(e instanceof UnauthorizedError)) setError(e.message)
            })
        return () => {
            cancelled = true
        }
    }, [])

    const parsed = parseDecimal(value)
    const valid = Number.isFinite(parsed) && parsed >= 0 && parsed < 100
    const exampleCost = 10
    const example = valid ? exampleCost / (1 - parsed / 100) : null

    async function onSubmit(e: FormEvent) {
        e.preventDefault()
        if (!valid) {
            setError('Marża musi być z zakresu od 0 do 99,99.')
            return
        }
        setSaving(true)
        setError(null)
        setMessage(null)
        try {
            const result = await adminApi.updatePricingSettings(round2(parsed))
            setSaved(result.defaultMarginPercent)
            setValue(String(result.defaultMarginPercent))
            setMessage('Zapisano.')
        } catch (err) {
            if (!(err instanceof UnauthorizedError)) {
                setError(err instanceof Error ? err.message : 'Nie udało się zapisać ustawień')
            }
        } finally {
            setSaving(false)
        }
    }

    if (!loaded && !error) return <p className="text-stone-500">Ładowanie…</p>

    return (
        <div className="max-w-xl">
            <h1 className="text-2xl font-bold text-stone-900">Ustawienia</h1>

            <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4 rounded-2xl bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-stone-900">Domyślna marża</h2>
                <p className="text-sm text-stone-600">
                    Marża liczona jako procent ceny. Na jej podstawie system podpowiada cenę potrawy:
                    <strong> cena = koszt / (1 − marża)</strong>. Potrawa może mieć własną marżę ustawioną w jej edycji.
                </p>

                <label className="block max-w-xs">
                    <span className="mb-1 block text-sm font-medium text-stone-700">Marża domyślna (%)</span>
                    <input className="input" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} />
                </label>

                {example !== null && (
                    <p className="rounded-xl bg-brand-100 p-3 text-sm text-stone-700">
                        Przykład: potrawa z kosztem {formatPrice(exampleCost)} dostałaby sugerowaną cenę{' '}
                        <strong>{formatPrice(example)}</strong>.
                    </p>
                )}

                {error && (
                    <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                        {error}
                    </p>
                )}
                {message && <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}

                <div className="flex items-center gap-3">
                    <button type="submit" disabled={saving} className="btn-primary !px-5 !py-2 !text-base">
                        {saving ? 'Zapisywanie…' : 'Zapisz'}
                    </button>
                    {saved !== null && <span className="text-sm text-stone-500">Aktualnie: {formatPercent(saved)}</span>}
                </div>
            </form>
        </div>
    )
}