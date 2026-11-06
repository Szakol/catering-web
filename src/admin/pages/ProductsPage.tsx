import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { formatPrice } from '../../utils/format'
import { adminApi, UnauthorizedError } from '../adminApi'
import { parseDecimal, round2 } from '../formUtils'
import type { Product, Unit } from '../types'
import { UNIT_LABELS, UNITS } from '../units'

interface FormProps {
    initial: Product | null
    onSaved: () => void
    onCancel: () => void
}

function ProductForm({ initial, onSaved, onCancel }: FormProps) {
    const [name, setName] = useState(initial?.name ?? '')
    const [unit, setUnit] = useState<Unit>(initial?.unit ?? 'KG')
    const [cost, setCost] = useState(initial ? String(initial.costPerUnit) : '')
    const [active, setActive] = useState(initial?.active ?? true)
    const [error, setError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)

    async function onSubmit(e: FormEvent) {
        e.preventDefault()

        const costValue = parseDecimal(cost)
        if (name.trim().length < 2) {
            setError('Podaj nazwę produktu.')
            return
        }
        if (!Number.isFinite(costValue) || costValue < 0) {
            setError('Podaj poprawny koszt jednostkowy (0 lub więcej).')
            return
        }

        setSaving(true)
        setError(null)
        try {
            const request = { name: name.trim(), unit, costPerUnit: round2(costValue), active }
            if (initial) {
                await adminApi.updateProduct(initial.id, request)
            } else {
                await adminApi.createProduct(request)
            }
            onSaved()
        } catch (err) {
            if (!(err instanceof UnauthorizedError)) {
                setError(err instanceof Error ? err.message : 'Nie udało się zapisać produktu')
            }
        } finally {
            setSaving(false)
        }
    }

    return (
        <form onSubmit={onSubmit} noValidate className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-900">{initial ? 'Edycja produktu' : 'Nowy produkt'}</h2>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <label className="block lg:col-span-2">
                    <span className="mb-1 block text-sm font-medium text-stone-700">Nazwa</span>
                    <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
                </label>
                <label className="block">
                    <span className="mb-1 block text-sm font-medium text-stone-700">Jednostka</span>
                    <select className="input" value={unit} onChange={(e) => setUnit(e.target.value as Unit)}>
                        {UNITS.map((u) => (
                            <option key={u} value={u}>
                                {UNIT_LABELS[u]}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="block">
                    <span className="mb-1 block text-sm font-medium text-stone-700">Koszt za 1 {UNIT_LABELS[unit]} (zł)</span>
                    <input
                        className="input"
                        inputMode="decimal"
                        value={cost}
                        onChange={(e) => setCost(e.target.value)}
                        placeholder="np. 32,00"
                    />
                </label>
            </div>

            <p className="text-xs text-stone-500">
                Koszt jednostkowy ma dokładność do 1 grosza, więc produkty sypkie i płynne najlepiej podawać w kg lub l
                (a w przepisach ilości jak 0,150 kg).
            </p>

            <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="accent-brand-600" />
                Aktywny (dostępny w przepisach)
            </label>

            {error && (
                <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </p>
            )}

            <div className="flex gap-3">
                <button type="submit" disabled={saving} className="btn-primary !px-5 !py-2 !text-base">
                    {saving ? 'Zapisywanie…' : 'Zapisz'}
                </button>
                <button type="button" onClick={onCancel} className="btn-secondary !px-5 !py-2 !text-base">
                    Anuluj
                </button>
            </div>
        </form>
    )
}

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[] | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [tick, setTick] = useState(0)
    const [editing, setEditing] = useState<Product | 'new' | null>(null)
    const [search, setSearch] = useState('')

    useEffect(() => {
        let cancelled = false
        adminApi
            .listProducts()
            .then((list) => {
                if (!cancelled) {
                    setProducts(list)
                    setError(null)
                }
            })
            .catch((e: Error) => {
                if (!cancelled && !(e instanceof UnauthorizedError)) setError(e.message)
            })
        return () => {
            cancelled = true
        }
    }, [tick])

    const visible = useMemo(() => {
        const q = search.trim().toLowerCase()
        return (products ?? []).filter((p) => !q || p.name.toLowerCase().includes(q))
    }, [products, search])

    async function remove(product: Product) {
        if (!window.confirm(`Usunąć produkt „${product.name}"?`)) return
        setError(null)
        try {
            await adminApi.deleteProduct(product.id)
            setTick((t) => t + 1)
        } catch (e) {
            if (!(e instanceof UnauthorizedError)) {
                setError(e instanceof Error ? e.message : 'Nie udało się usunąć produktu')
            }
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-2xl font-bold text-stone-900">Produkty (składniki)</h1>
                <button
                    type="button"
                    onClick={() => setEditing('new')}
                    className="rounded-lg bg-brand-300 px-4 py-2 text-sm font-semibold text-brand-900 hover:bg-brand-400"
                >
                    + Nowy produkt
                </button>
            </div>
            <p className="text-sm text-stone-600">
                Tu wpisujesz składniki i ich koszt. Z nich w przepisach liczy się koszt wytworzenia każdej potrawy.
            </p>

            {editing && (
                <ProductForm
                    key={editing === 'new' ? 'new' : editing.id}
                    initial={editing === 'new' ? null : editing}
                    onSaved={() => {
                        setEditing(null)
                        setTick((t) => t + 1)
                    }}
                    onCancel={() => setEditing(null)}
                />
            )}

            <input className="input max-w-sm" placeholder="Szukaj produktu" value={search} onChange={(e) => setSearch(e.target.value)} />

            {error && (
                <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </p>
            )}

            <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
                <table className="w-full min-w-[560px] text-left text-sm">
                    <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                    <tr>
                        <th className="px-4 py-3">Nazwa</th>
                        <th className="px-4 py-3">Koszt jednostkowy</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Akcje</th>
                    </tr>
                    </thead>
                    <tbody>
                    {products === null && (
                        <tr>
                            <td colSpan={4} className="px-4 py-10 text-center text-stone-500">
                                Ładowanie…
                            </td>
                        </tr>
                    )}
                    {products !== null && visible.length === 0 && (
                        <tr>
                            <td colSpan={4} className="px-4 py-10 text-center text-stone-500">
                                Brak produktów.
                            </td>
                        </tr>
                    )}
                    {visible.map((p) => (
                        <tr key={p.id} className="border-b border-stone-100 last:border-0">
                            <td className="px-4 py-3 font-medium text-stone-900">{p.name}</td>
                            <td className="px-4 py-3">
                                {formatPrice(p.costPerUnit)} / {UNIT_LABELS[p.unit]}
                            </td>
                            <td className="px-4 py-3">
                  <span
                      className={[
                          'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                          p.active ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600',
                      ].join(' ')}
                  >
                    {p.active ? 'aktywny' : 'nieaktywny'}
                  </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                                <button type="button" onClick={() => setEditing(p)} className="text-brand-700 hover:underline">
                                    Edytuj
                                </button>
                                <button type="button" onClick={() => void remove(p)} className="ml-4 text-stone-500 hover:text-red-600">
                                    Usuń
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}