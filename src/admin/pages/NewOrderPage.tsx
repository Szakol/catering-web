import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { api } from '../../api/client'
import type { MenuItem, PaymentMethod } from '../../api/types'
import { BOX_MAX_ITEMS, BOX_MIN_ITEMS } from '../../config'
import { adminApi, UnauthorizedError } from '../adminApi'
import BoxEditor from '../BoxEditor'
import { EMAIL_RE, PHONE_RE, todayIso } from '../formUtils'
import { FULFILLMENT_LABELS, PAYMENT_METHOD_LABELS } from '../labels'
import type { FulfillmentType } from '../types'

interface BoxDraft {
    key: number
    quantity: number
    ids: number[]
}

interface FormState {
    name: string
    phone: string
    email: string
    type: FulfillmentType
    address: string
    date: string
    time: string
    notes: string
    payment: PaymentMethod
}

type Errors = Partial<Record<'name' | 'phone' | 'email' | 'address' | 'when' | 'boxes', string>>

const INITIAL: FormState = {
    name: '',
    phone: '',
    email: '',
    type: 'PICKUP',
    address: '',
    date: '',
    time: '',
    notes: '',
    payment: 'BLIK_PHONE',
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
    return (
        <label className="block">
            <span className="mb-1 block text-sm font-medium text-stone-700">{label}</span>
            {children}
            {error && <span className="mt-1 block text-sm text-red-600">{error}</span>}
        </label>
    )
}

export default function NewOrderPage() {
    const navigate = useNavigate()
    const nextKey = useRef(2)

    const [menu, setMenu] = useState<MenuItem[]>([])
    const [menuError, setMenuError] = useState<string | null>(null)
    const [form, setForm] = useState<FormState>(INITIAL)
    const [boxes, setBoxes] = useState<BoxDraft[]>([{ key: 1, quantity: 1, ids: [] }])
    const [errors, setErrors] = useState<Errors>({})
    const [submitting, setSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)

    useEffect(() => {
        api.getMenu().then(setMenu).catch((e: Error) => setMenuError(e.message))
    }, [])

    function update<K extends keyof FormState>(key: K, value: FormState[K]) {
        setForm((current) => ({ ...current, [key]: value }))
    }

    function toggleItem(boxKey: number, id: number) {
        setBoxes((current) =>
            current.map((b) => {
                if (b.key !== boxKey) return b
                if (b.ids.includes(id)) return { ...b, ids: b.ids.filter((x) => x !== id) }
                if (b.ids.length >= BOX_MAX_ITEMS) return b
                return { ...b, ids: [...b.ids, id] }
            }),
        )
    }

    function setQuantity(boxKey: number, quantity: number) {
        setBoxes((current) => current.map((b) => (b.key === boxKey ? { ...b, quantity } : b)))
    }

    function addBox() {
        const key = nextKey.current++
        setBoxes((current) => [...current, { key, quantity: 1, ids: [] }])
    }

    function removeBox(boxKey: number) {
        setBoxes((current) => current.filter((b) => b.key !== boxKey))
    }

    function validate(): Errors {
        const found: Errors = {}

        if (form.name.trim().length < 2) found.name = 'Podaj imię i nazwisko.'
        if (!PHONE_RE.test(form.phone.trim())) found.phone = 'Podaj poprawny numer telefonu.'
        if (form.email.trim() !== '' && !EMAIL_RE.test(form.email.trim())) found.email = 'Niepoprawny adres e-mail.'
        if (form.type === 'DELIVERY' && form.address.trim() === '') found.address = 'Dla dostawy podaj adres.'

        if (!form.date || !form.time) {
            found.when = 'Wybierz datę i godzinę.'
        } else if (new Date(`${form.date}T${form.time}`).getTime() <= Date.now()) {
            found.when = 'Termin musi być w przyszłości.'
        }

        if (boxes.some((b) => b.ids.length < BOX_MIN_ITEMS || b.ids.length > BOX_MAX_ITEMS)) {
            found.boxes = `Każdy box musi mieć od ${BOX_MIN_ITEMS} do ${BOX_MAX_ITEMS} pozycji.`
        }

        return found
    }

    async function onSubmit(e: FormEvent) {
        e.preventDefault()
        const found = validate()
        setErrors(found)
        if (Object.keys(found).length > 0) return

        setSubmitting(true)
        setSubmitError(null)
        try {
            const time = form.time.length === 5 ? `${form.time}:00` : form.time
            const created = await adminApi.createOrder({
                customerName: form.name.trim(),
                customerPhone: form.phone.trim(),
                customerEmail: form.email.trim() || undefined,
                fulfillmentType: form.type,
                deliveryAddress: form.type === 'DELIVERY' ? form.address.trim() : undefined,
                fulfillmentAt: `${form.date}T${time}`,
                notes: form.notes.trim() || undefined,
                paymentMethod: form.payment,
                boxes: boxes.map((b) => ({ quantity: b.quantity, menuItemIds: b.ids })),
            })
            navigate(`/admin/zamowienia/${created.id}`)
        } catch (err) {
            if (!(err instanceof UnauthorizedError)) {
                const message = err instanceof Error ? err.message : 'Nie udało się dodać zamówienia.'
                setSubmitError(message.includes('Invalid request') ? 'Sprawdź poprawność wprowadzonych danych.' : message)
            }
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div>
            <h1 className="text-2xl font-bold text-stone-900">Nowe zamówienie (ręczne)</h1>
            <p className="mt-1 text-sm text-stone-600">
                Dla zamówień telefonicznych i osobistych. Zamówienie od razu dostaje status „Potwierdzone", a klient SMS z
                danymi do płatności.
            </p>

            <form onSubmit={onSubmit} noValidate className="mt-6 space-y-6">
                <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
                    <h2 className="text-lg font-semibold text-stone-900">Klient</h2>
                    <div className="grid gap-4 sm:grid-cols-3">
                        <Field label="Imię i nazwisko" error={errors.name}>
                            <input className="input" value={form.name} onChange={(e) => update('name', e.target.value)} />
                        </Field>
                        <Field label="Telefon" error={errors.phone}>
                            <input className="input" type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
                        </Field>
                        <Field label="E-mail (opcjonalnie)" error={errors.email}>
                            <input className="input" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} />
                        </Field>
                    </div>
                </section>

                <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
                    <h2 className="text-lg font-semibold text-stone-900">Odbiór / dostawa i płatność</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Field label="Sposób realizacji">
                            <select
                                className="input"
                                value={form.type}
                                onChange={(e) => update('type', e.target.value as FulfillmentType)}
                            >
                                {(Object.keys(FULFILLMENT_LABELS) as FulfillmentType[]).map((t) => (
                                    <option key={t} value={t}>
                                        {FULFILLMENT_LABELS[t]}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Data" error={errors.when}>
                            <input className="input" type="date" min={todayIso()} value={form.date} onChange={(e) => update('date', e.target.value)} />
                        </Field>
                        <Field label="Godzina">
                            <input className="input" type="time" value={form.time} onChange={(e) => update('time', e.target.value)} />
                        </Field>
                        <Field label="Płatność">
                            <select
                                className="input"
                                value={form.payment}
                                onChange={(e) => update('payment', e.target.value as PaymentMethod)}
                            >
                                {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((p) => (
                                    <option key={p} value={p}>
                                        {PAYMENT_METHOD_LABELS[p]}
                                    </option>
                                ))}
                            </select>
                        </Field>
                    </div>

                    {form.type === 'DELIVERY' && (
                        <Field label="Adres dostawy" error={errors.address}>
                            <input className="input" value={form.address} onChange={(e) => update('address', e.target.value)} />
                        </Field>
                    )}

                    <Field label="Uwagi (opcjonalnie)">
            <textarea
                className="input min-h-20"
                maxLength={1000}
                value={form.notes}
                onChange={(e) => update('notes', e.target.value)}
            />
                    </Field>
                </section>

                <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
                    <h2 className="text-lg font-semibold text-stone-900">Boxy</h2>
                    {menuError && <p className="text-sm text-red-600">Nie udało się wczytać menu: {menuError}</p>}

                    {boxes.map((box, index) => (
                        <BoxEditor
                            key={box.key}
                            index={index}
                            menu={menu}
                            ids={box.ids}
                            quantity={box.quantity}
                            canRemove={boxes.length > 1}
                            onToggle={(id) => toggleItem(box.key, id)}
                            onQuantity={(q) => setQuantity(box.key, q)}
                            onRemove={() => removeBox(box.key)}
                        />
                    ))}

                    {errors.boxes && <p className="text-sm text-red-600">{errors.boxes}</p>}

                    <button
                        type="button"
                        onClick={addBox}
                        className="rounded-xl border-2 border-dashed border-brand-400 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50"
                    >
                        + Dodaj kolejny box
                    </button>
                </section>

                {submitError && (
                    <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                        {submitError}
                    </p>
                )}

                <button type="submit" disabled={submitting} className="btn-primary">
                    {submitting ? 'Zapisywanie…' : 'Dodaj zamówienie'}
                </button>
            </form>
        </div>
    )
}