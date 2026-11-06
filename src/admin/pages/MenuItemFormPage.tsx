import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { formatPrice } from '../../utils/format'
import { adminApi, UnauthorizedError } from '../adminApi'
import { formatPercent, parseDecimal, round2 } from '../formUtils'
import type { MenuItemAdmin, MenuItemRequest, Product } from '../types'
import { UNIT_LABELS } from '../units'

interface Row {
    key: number
    productId: string
    quantity: string
}

interface FormState {
    name: string
    description: string
    price: string
    sortOrder: string
    active: boolean
    customMargin: boolean
    marginPercent: string
}

type Errors = Partial<Record<'name' | 'price' | 'sort' | 'margin' | 'ingredients', string>>

const EMPTY_FORM: FormState = {
    name: '',
    description: '',
    price: '',
    sortOrder: '0',
    active: true,
    customMargin: false,
    marginPercent: '',
}

function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: ReactNode }) {
    return (
        <label className="block">
            <span className="mb-1 block text-sm font-medium text-stone-700">{label}</span>
            {children}
            {hint && !error && <span className="mt-1 block text-xs text-stone-500">{hint}</span>}
            {error && <span className="mt-1 block text-sm text-red-600">{error}</span>}
        </label>
    )
}

export default function MenuItemFormPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const editingId = id === undefined ? null : Number(id)
    const invalidId = editingId !== null && !Number.isInteger(editingId)

    const nextKey = useRef(1)
    const [products, setProducts] = useState<Product[]>([])
    const [defaultMargin, setDefaultMargin] = useState<number | null>(null)
    const [form, setForm] = useState<FormState>(EMPTY_FORM)
    const [rows, setRows] = useState<Row[]>([])
    const [loaded, setLoaded] = useState(false)
    const [loadError, setLoadError] = useState<string | null>(null)
    const [errors, setErrors] = useState<Errors>({})
    const [saving, setSaving] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)

    useEffect(() => {
        if (invalidId) return
        let cancelled = false

        Promise.all([
            adminApi.listProducts(),
            adminApi.getPricingSettings(),
            editingId !== null ? adminApi.getMenuItem(editingId) : Promise.resolve<MenuItemAdmin | null>(null),
        ])
            .then(([productList, settings, item]) => {
                if (cancelled) return
                setProducts(productList)
                setDefaultMargin(settings.defaultMarginPercent)
                if (item) {
                    setForm({
                        name: item.name,
                        description: item.description ?? '',
                        price: String(item.price),
                        sortOrder: String(item.sortOrder),
                        active: item.active,
                        customMargin: item.customTargetMargin,
                        marginPercent: item.customTargetMargin ? String(item.targetMarginPercent) : '',
                    })
                    setRows(
                        item.ingredients.map((i) => ({
                            key: nextKey.current++,
                            productId: String(i.productId),
                            quantity: String(i.quantity),
                        })),
                    )
                }
                setLoaded(true)
            })
            .catch((e: Error) => {
                if (!cancelled && !(e instanceof UnauthorizedError)) setLoadError(e.message)
            })

        return () => {
            cancelled = true
        }
    }, [editingId, invalidId])

    function update<K extends keyof FormState>(key: K, value: FormState[K]) {
        setForm((current) => ({ ...current, [key]: value }))
    }

    function updateRow(key: number, patch: Partial<Row>) {
        setRows((current) => current.map((r) => (r.key === key ? { ...r, ...patch } : r)))
    }

    function addRow() {
        const key = nextKey.current++
        setRows((current) => [...current, { key, productId: '', quantity: '' }])
    }

    function removeRow(key: number) {
        setRows((current) => current.filter((r) => r.key !== key))
    }

    const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products])

    // podgląd liczony w przeglądarce, ostateczne wartości po zapisie liczy backend
    const preview = useMemo(() => {
        const cost = rows.reduce((sum, r) => {
            const product = productById.get(Number(r.productId))
            const quantity = parseDecimal(r.quantity)
            return product && Number.isFinite(quantity) && quantity > 0 ? sum + product.costPerUnit * quantity : sum
        }, 0)

        const targetMargin = form.customMargin ? parseDecimal(form.marginPercent) : (defaultMargin ?? Number.NaN)
        const marginValid = Number.isFinite(targetMargin) && targetMargin >= 0 && targetMargin < 100
        const suggested = marginValid ? cost / (1 - targetMargin / 100) : null

        const price = parseDecimal(form.price)
        const priceValid = Number.isFinite(price) && price >= 0
        const margin = priceValid ? price - cost : null
        const marginPercent = priceValid && price > 0 && margin !== null ? (margin / price) * 100 : null

        return { cost, targetMargin: marginValid ? targetMargin : null, suggested, price: priceValid ? price : null, margin, marginPercent }
    }, [rows, productById, form.customMargin, form.marginPercent, form.price, defaultMargin])

    function validate(): Errors {
        const found: Errors = {}

        if (form.name.trim().length < 2) found.name = 'Podaj nazwę potrawy.'

        const price = parseDecimal(form.price)
        if (!Number.isFinite(price) || price < 0) found.price = 'Podaj cenę (0 lub więcej).'

        const sort = Number(form.sortOrder)
        if (!Number.isInteger(sort)) found.sort = 'Kolejność musi być liczbą całkowitą.'

        if (form.customMargin) {
            const margin = parseDecimal(form.marginPercent)
            if (!Number.isFinite(margin) || margin < 0 || margin >= 100) {
                found.margin = 'Marża musi być z zakresu od 0 do 99,99.'
            }
        }

        const seen = new Set<string>()
        for (const r of rows) {
            const quantity = parseDecimal(r.quantity)
            if (r.productId === '' || !Number.isFinite(quantity) || quantity <= 0) {
                found.ingredients = 'Każdy składnik musi mieć wybrany produkt i ilość większą od zera.'
                break
            }
            if (seen.has(r.productId)) {
                found.ingredients = 'Ten sam produkt występuje w przepisie więcej niż raz.'
                break
            }
            seen.add(r.productId)
        }

        return found
    }

    async function onSubmit(e: FormEvent) {
        e.preventDefault()
        const found = validate()
        setErrors(found)
        if (Object.keys(found).length > 0) return

        const request: MenuItemRequest = {
            name: form.name.trim(),
            description: form.description.trim() || undefined,
            price: round2(parseDecimal(form.price)),
            marginPercent: form.customMargin ? round2(parseDecimal(form.marginPercent)) : null,
            active: form.active,
            sortOrder: Number(form.sortOrder),
            ingredients: rows.map((r) => ({
                productId: Number(r.productId),
                quantity: Math.round(parseDecimal(r.quantity) * 1000) / 1000,
            })),
        }

        setSaving(true)
        setSubmitError(null)
        try {
            if (editingId === null) {
                await adminApi.createMenuItem(request)
            } else {
                await adminApi.updateMenuItem(editingId, request)
            }
            navigate('/admin/menu')
        } catch (err) {
            if (!(err instanceof UnauthorizedError)) {
                const message = err instanceof Error ? err.message : 'Nie udało się zapisać potrawy.'
                setSubmitError(message.includes('Invalid request') ? 'Sprawdź poprawność wprowadzonych danych.' : message)
            }
        } finally {
            setSaving(false)
        }
    }

    async function onDelete() {
        if (editingId === null) return
        if (
            !window.confirm(
                'Usunąć tę potrawę? Historia zamówień zostanie zachowana, ale potrawa zniknie z menu. Zwykle lepiej ją po prostu ukryć (odznacz „Aktywna").',
            )
        ) {
            return
        }
        try {
            await adminApi.deleteMenuItem(editingId)
            navigate('/admin/menu')
        } catch (err) {
            if (!(err instanceof UnauthorizedError)) {
                setSubmitError(err instanceof Error ? err.message : 'Nie udało się usunąć potrawy.')
            }
        }
    }

    if (invalidId) return <p className="text-red-600">Niepoprawny identyfikator potrawy.</p>
    if (loadError) {
        return (
            <div>
                <p className="text-red-600">{loadError}</p>
                <Link to="/admin/menu" className="mt-3 inline-block text-brand-700 underline">
                    Wróć do menu
                </Link>
            </div>
        )
    }
    if (!loaded) return <p className="text-stone-500">Ładowanie…</p>

    const usedProductIds = new Set(rows.map((r) => r.productId))

    return (
        <div>
            <Link to="/admin/menu" className="text-sm text-stone-500 hover:text-stone-800">
                ← Menu
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-stone-900">{editingId === null ? 'Nowa potrawa' : 'Edycja potrawy'}</h1>

            <form onSubmit={onSubmit} noValidate className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
                <div className="space-y-6">
                    <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
                        <h2 className="text-lg font-semibold text-stone-900">Podstawowe dane</h2>

                        <Field label="Nazwa" error={errors.name}>
                            <input className="input" value={form.name} onChange={(e) => update('name', e.target.value)} />
                        </Field>

                        <Field label="Opis dla klienta (opcjonalnie)">
              <textarea
                  className="input min-h-20"
                  maxLength={1000}
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
              />
                        </Field>

                        <div className="grid gap-4 sm:grid-cols-3">
                            <Field label="Cena (zł)" error={errors.price}>
                                <input
                                    className="input"
                                    inputMode="decimal"
                                    value={form.price}
                                    onChange={(e) => update('price', e.target.value)}
                                    placeholder="np. 18,00"
                                />
                            </Field>
                            <Field label="Kolejność w menu" error={errors.sort} hint="Mniejsza liczba = wyżej.">
                                <input
                                    className="input"
                                    inputMode="numeric"
                                    value={form.sortOrder}
                                    onChange={(e) => update('sortOrder', e.target.value)}
                                />
                            </Field>
                            <div className="flex items-end pb-2">
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={form.active}
                                        onChange={(e) => update('active', e.target.checked)}
                                        className="accent-brand-600"
                                    />
                                    Aktywna (widoczna dla klientów)
                                </label>
                            </div>
                        </div>

                        <div className="rounded-xl bg-stone-50 p-3">
                            <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
                                <input
                                    type="checkbox"
                                    checked={form.customMargin}
                                    onChange={(e) => update('customMargin', e.target.checked)}
                                    className="accent-brand-600"
                                />
                                Własna marża docelowa dla tej potrawy
                            </label>
                            {form.customMargin ? (
                                <div className="mt-3 max-w-xs">
                                    <Field label="Marża docelowa (% ceny)" error={errors.margin}>
                                        <input
                                            className="input"
                                            inputMode="decimal"
                                            value={form.marginPercent}
                                            onChange={(e) => update('marginPercent', e.target.value)}
                                        />
                                    </Field>
                                </div>
                            ) : (
                                <p className="mt-1 text-xs text-stone-500">
                                    Obowiązuje marża domyślna
                                    {defaultMargin !== null && <> ({formatPercent(defaultMargin)})</>}. Zmienisz ją w Ustawieniach.
                                </p>
                            )}
                        </div>
                    </section>

                    <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
                        <h2 className="text-lg font-semibold text-stone-900">Przepis (składniki)</h2>
                        <p className="text-sm text-stone-600">
                            Ilość podajesz w jednostce produktu, np. dla produktu w kg: 0,150 to 150 g.
                        </p>

                        {rows.length === 0 && <p className="text-sm text-stone-500">Brak składników. Koszt potrawy wynosi 0 zł.</p>}

                        <div className="space-y-3">
                            {rows.map((row) => {
                                const product = productById.get(Number(row.productId))
                                const quantity = parseDecimal(row.quantity)
                                const lineCost = product && Number.isFinite(quantity) && quantity > 0 ? product.costPerUnit * quantity : null

                                return (
                                    <div key={row.key} className="grid gap-2 sm:grid-cols-[1fr_160px_110px_auto] sm:items-center">
                                        <select
                                            className="input"
                                            value={row.productId}
                                            onChange={(e) => updateRow(row.key, { productId: e.target.value })}
                                            aria-label="Produkt"
                                        >
                                            <option value="">Wybierz produkt…</option>
                                            {products
                                                .filter((p) => p.active || String(p.id) === row.productId)
                                                .map((p) => (
                                                    <option key={p.id} value={p.id} disabled={usedProductIds.has(String(p.id)) && String(p.id) !== row.productId}>
                                                        {p.name} ({formatPrice(p.costPerUnit)} / {UNIT_LABELS[p.unit]}){p.active ? '' : ' [nieaktywny]'}
                                                    </option>
                                                ))}
                                        </select>

                                        <div className="flex items-center gap-2">
                                            <input
                                                className="input"
                                                inputMode="decimal"
                                                placeholder="ilość"
                                                value={row.quantity}
                                                onChange={(e) => updateRow(row.key, { quantity: e.target.value })}
                                                aria-label="Ilość"
                                            />
                                            <span className="w-10 text-sm text-stone-500">{product ? UNIT_LABELS[product.unit] : ''}</span>
                                        </div>

                                        <span className="text-sm text-stone-600">{lineCost !== null ? formatPrice(lineCost) : ''}</span>

                                        <button type="button" onClick={() => removeRow(row.key)} className="text-sm text-stone-500 hover:text-red-600">
                                            Usuń
                                        </button>
                                    </div>
                                )
                            })}
                        </div>

                        {errors.ingredients && <p className="text-sm text-red-600">{errors.ingredients}</p>}

                        <button
                            type="button"
                            onClick={addRow}
                            className="rounded-xl border-2 border-dashed border-brand-400 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50"
                        >
                            + Dodaj składnik
                        </button>
                        {products.length === 0 && (
                            <p className="text-sm text-amber-700">
                                Nie masz jeszcze produktów. Dodaj je najpierw w zakładce{' '}
                                <Link to="/admin/produkty" className="underline">
                                    Produkty
                                </Link>
                                .
                            </p>
                        )}
                    </section>
                </div>

                <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
                    <section className="rounded-2xl border-2 border-brand-300 bg-brand-100/70 p-5 shadow">
                        <h2 className="text-lg font-bold text-stone-900">Podgląd wyceny</h2>
                        <dl className="mt-3 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <dt className="text-stone-600">Koszt wytworzenia</dt>
                                <dd className="font-semibold">{formatPrice(preview.cost)}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-stone-600">Marża docelowa</dt>
                                <dd className="font-semibold">{preview.targetMargin !== null ? formatPercent(preview.targetMargin) : '—'}</dd>
                            </div>
                            <div className="flex justify-between border-t border-brand-300 pt-2">
                                <dt className="text-stone-600">Sugerowana cena</dt>
                                <dd className="text-lg font-bold">{preview.suggested !== null ? formatPrice(preview.suggested) : '—'}</dd>
                            </div>
                        </dl>

                        {preview.suggested !== null && (
                            <button
                                type="button"
                                onClick={() => update('price', round2(preview.suggested ?? 0).toFixed(2))}
                                className="mt-3 w-full rounded-xl bg-white px-3 py-2 text-sm font-semibold text-brand-800 ring-1 ring-brand-300 hover:bg-brand-50"
                            >
                                Użyj sugerowanej ceny
                            </button>
                        )}

                        <div className="mt-4 border-t border-brand-300 pt-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-stone-600">Twoja cena</span>
                                <span className="font-semibold">{preview.price !== null ? formatPrice(preview.price) : '—'}</span>
                            </div>
                            <div className="mt-1 flex justify-between">
                                <span className="text-stone-600">Marża przy tej cenie</span>
                                <span
                                    className={[
                                        'font-semibold',
                                        preview.marginPercent !== null && preview.targetMargin !== null && preview.marginPercent < preview.targetMargin
                                            ? 'text-amber-700'
                                            : 'text-emerald-700',
                                    ].join(' ')}
                                >
                  {preview.margin !== null && preview.marginPercent !== null
                      ? `${formatPrice(preview.margin)} (${formatPercent(preview.marginPercent)})`
                      : '—'}
                </span>
                            </div>
                        </div>
                        <p className="mt-3 text-xs text-stone-500">Podgląd liczony na bieżąco. Wartości ostateczne policzy system po zapisie.</p>
                    </section>

                    {submitError && (
                        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                            {submitError}
                        </p>
                    )}

                    <button type="submit" disabled={saving} className="btn-primary w-full">
                        {saving ? 'Zapisywanie…' : 'Zapisz potrawę'}
                    </button>

                    {editingId !== null && (
                        <button type="button" onClick={() => void onDelete()} className="w-full text-sm text-stone-500 hover:text-red-600">
                            Usuń potrawę
                        </button>
                    )}
                </aside>
            </form>
        </div>
    )
}