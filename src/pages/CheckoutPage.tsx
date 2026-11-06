import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { api } from '../api/client'
import type { PaymentMethod } from '../api/types'
import { useCart } from '../cart/cart'
import { MIN_DAYS_AHEAD, PICKUP_FROM, PICKUP_TO } from '../config'
import { site } from '../content'
import { formatPrice } from '../utils/format'

const PHONE_RE = /^[+0-9 ()-]{9,20}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface FormState {
    name: string
    phone: string
    email: string
    date: string
    time: string
    notes: string
    payment: PaymentMethod
}

type Errors = Partial<Record<'name' | 'phone' | 'email' | 'when', string>>

const INITIAL: FormState = {
    name: '',
    phone: '',
    email: '',
    date: '',
    time: '',
    notes: '',
    payment: 'BLIK_PHONE',
}

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string }[] = [
    { value: 'BLIK_PHONE', label: 'BLIK na telefon' },
    { value: 'TRANSFER', label: 'Przelew' },
]

function isoDate(d: Date): string {
    return d.toLocaleDateString('sv-SE') // format RRRR-MM-DD w czasie lokalnym
}

/** Najwcześniejszy dzień odbioru: dziś + MIN_DAYS_AHEAD dni kalendarzowych */
function earliestPickupDate(): string {
    const d = new Date()
    d.setDate(d.getDate() + MIN_DAYS_AHEAD)
    return isoDate(d)
}

function validate(form: FormState): Errors {
    const errors: Errors = {}

    if (form.name.trim().length < 2) {
        errors.name = 'Podaj imię i nazwisko.'
    }
    if (!PHONE_RE.test(form.phone.trim())) {
        errors.phone = 'Podaj poprawny numer telefonu (9-20 znaków: cyfry, spacje, +, -, nawiasy).'
    }
    if (form.email.trim() !== '' && !EMAIL_RE.test(form.email.trim())) {
        errors.email = 'Podaj poprawny adres e-mail albo zostaw pole puste.'
    }
    if (!form.date || !form.time) {
        errors.when = 'Wybierz datę i godzinę odbioru.'
    } else if (form.date < earliestPickupDate()) {
        errors.when = `Zamówienie składamy z minimum ${MIN_DAYS_AHEAD} dniami wyprzedzenia. Najwcześniejszy termin: ${earliestPickupDate()}.`
    } else if (form.time < PICKUP_FROM || form.time > PICKUP_TO) {
        errors.when = `Odbiór jest możliwy w godzinach ${PICKUP_FROM}–${PICKUP_TO}.`
    }

    return errors
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

export default function CheckoutPage() {
    const { boxes, total, clear } = useCart()
    const navigate = useNavigate()

    const [form, setForm] = useState<FormState>(INITIAL)
    const [errors, setErrors] = useState<Errors>({})
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)

    if (boxes.length === 0 && !submitted) {
        return <Navigate to="/zamow" replace />
    }

    function update<K extends keyof FormState>(key: K, value: FormState[K]) {
        setForm((current) => ({ ...current, [key]: value }))
    }

    async function onSubmit(e: FormEvent) {
        e.preventDefault()

        const found = validate(form)
        setErrors(found)
        if (Object.keys(found).length > 0) return

        setSubmitting(true)
        setSubmitError(null)

        try {
            const time = form.time.length === 5 ? `${form.time}:00` : form.time
            const confirmation = await api.createOrder({
                customerName: form.name.trim(),
                customerPhone: form.phone.trim(),
                customerEmail: form.email.trim() || undefined,
                fulfillmentType: 'PICKUP',
                fulfillmentAt: `${form.date}T${time}`,
                notes: form.notes.trim() || undefined,
                paymentMethod: form.payment,
                boxes: boxes.map((b) => ({
                    quantity: b.quantity,
                    menuItemIds: b.items.map((i) => i.id),
                })),
            })

            setSubmitted(true)
            clear()
            navigate('/potwierdzenie', { replace: true, state: confirmation })
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Nie udało się złożyć zamówienia.'
            setSubmitError(
                message.includes('Invalid request') ? 'Sprawdź poprawność wprowadzonych danych.' : message,
            )
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="mx-auto max-w-6xl px-4 py-8">
            <h1 className="text-3xl font-bold text-stone-900">Dane do zamówienia</h1>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
                <form onSubmit={onSubmit} noValidate className="space-y-6 rounded-2xl bg-white p-6 shadow-sm">
                    <section className="space-y-4">
                        <h2 className="text-lg font-semibold text-stone-900">Twoje dane</h2>
                        <Field label="Imię i nazwisko" error={errors.name}>
                            <input
                                className="input"
                                value={form.name}
                                onChange={(e) => update('name', e.target.value)}
                                autoComplete="name"
                            />
                        </Field>
                        <Field
                            label="Telefon"
                            error={errors.phone}
                            hint="Na ten numer wyślemy SMS-y o statusie zamówienia i danych do płatności."
                        >
                            <input
                                className="input"
                                type="tel"
                                value={form.phone}
                                onChange={(e) => update('phone', e.target.value)}
                                autoComplete="tel"
                            />
                        </Field>
                        <Field label="E-mail (opcjonalnie)" error={errors.email}>
                            <input
                                className="input"
                                type="email"
                                value={form.email}
                                onChange={(e) => update('email', e.target.value)}
                                autoComplete="email"
                            />
                        </Field>
                    </section>

                    <section className="space-y-4">
                        <div>
                            <h2 className="text-lg font-semibold text-stone-900">Odbiór osobisty</h2>
                            <p className="text-sm text-stone-600">Miejsce odbioru: {site.contact.city}</p>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field
                                label="Data odbioru"
                                error={errors.when}
                                hint={`Zamówienie z minimum ${MIN_DAYS_AHEAD} dniami wyprzedzenia.`}
                            >
                                <input
                                    className="input"
                                    type="date"
                                    min={earliestPickupDate()}
                                    value={form.date}
                                    onChange={(e) => update('date', e.target.value)}
                                />
                            </Field>
                            <Field label="Godzina odbioru" hint={`Odbiór w godzinach ${PICKUP_FROM}–${PICKUP_TO}.`}>
                                <input
                                    className="input"
                                    type="time"
                                    min={PICKUP_FROM}
                                    max={PICKUP_TO}
                                    value={form.time}
                                    onChange={(e) => update('time', e.target.value)}
                                />
                            </Field>
                        </div>
                        <Field label="Uwagi do zamówienia (opcjonalnie)" hint="Np. alergie, życzenia co do pakowania.">
              <textarea
                  className="input min-h-24"
                  maxLength={1000}
                  value={form.notes}
                  onChange={(e) => update('notes', e.target.value)}
              />
                        </Field>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-lg font-semibold text-stone-900">Płatność</h2>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {PAYMENT_OPTIONS.map((option) => (
                                <label
                                    key={option.value}
                                    className={[
                                        'flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 transition',
                                        form.payment === option.value
                                            ? 'border-brand-500 bg-brand-100'
                                            : 'border-stone-200 hover:border-brand-300',
                                    ].join(' ')}
                                >
                                    <input
                                        type="radio"
                                        name="payment"
                                        value={option.value}
                                        checked={form.payment === option.value}
                                        onChange={() => update('payment', option.value)}
                                        className="accent-brand-600"
                                    />
                                    <span className="font-medium text-stone-900">{option.label}</span>
                                </label>
                            ))}
                        </div>
                        <p className="text-sm text-stone-500">
                            Po potwierdzeniu zamówienia wyślemy SMS z kwotą i danymi do płatności.
                        </p>
                    </section>

                    {submitError && (
                        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                            {submitError}
                        </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3">
                        <button type="submit" disabled={submitting} className="btn-primary">
                            {submitting ? 'Wysyłanie…' : 'Złóż zamówienie'}
                        </button>
                        <Link to="/koszyk" className="text-sm text-stone-600 underline hover:text-stone-900">
                            Wróć do koszyka
                        </Link>
                    </div>
                </form>

                <aside className="lg:sticky lg:top-20 lg:self-start">
                    <div className="rounded-3xl border-2 border-brand-300 bg-brand-100/70 p-5 shadow-lg">
                        <h2 className="text-lg font-bold text-stone-900">Podsumowanie</h2>
                        <ul className="mt-3 space-y-2 text-sm text-stone-700">
                            {boxes.map((box, index) => (
                                <li key={box.id} className="flex justify-between gap-3">
                  <span>
                    Box {index + 1} × {box.quantity}
                  </span>
                                    <span className="font-medium">{formatPrice(box.unitPrice * box.quantity)}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-4 flex items-end justify-between border-t border-brand-300 pt-4">
                            <span className="text-stone-600">Razem</span>
                            <span className="text-2xl font-bold text-stone-900">{formatPrice(total)}</span>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    )
}