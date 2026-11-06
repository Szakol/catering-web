import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router'
import type { OrderConfirmation, PaymentMethod } from '../api/types'
import { site } from '../content'
import { formatPrice } from '../utils/format'

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
    BLIK_PHONE: 'BLIK na telefon',
    TRANSFER: 'Przelew',
}

export default function ConfirmationPage() {
    const { state } = useLocation()
    const order = state as OrderConfirmation | null
    const [copied, setCopied] = useState(false)

    // wejście bezpośrednio na ten adres (bez złożonego zamówienia)
    if (!order || typeof order.orderCode !== 'string') {
        return <Navigate to="/" replace />
    }

    async function copyCode() {
        if (!order) return
        try {
            await navigator.clipboard.writeText(order.orderCode)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            /* schowek niedostępny: numer i tak jest widoczny na ekranie */
        }
    }

    return (
        <div className="mx-auto max-w-2xl px-4 py-16">
            <div className="rounded-3xl bg-white p-8 text-center shadow-lg">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-300 text-2xl text-brand-900">
          ✓
        </span>
                <h1 className="mt-4 text-3xl font-bold text-stone-900">Dziękujemy za zamówienie!</h1>
                <p className="mt-1 text-stone-600">{site.pickupInfo}.</p>
                <p className="mt-2 text-stone-600">Zamówienie zostało przyjęte i czeka na potwierdzenie.</p>

                <div className="mx-auto mt-6 max-w-sm rounded-2xl border-2 border-brand-300 bg-brand-100 p-4">
                    <p className="text-sm text-stone-600">Numer zamówienia</p>
                    <p className="mt-1 font-mono text-3xl font-bold tracking-widest text-stone-900">{order.orderCode}</p>
                    <button type="button" onClick={copyCode} className="mt-2 text-sm text-brand-700 underline hover:text-brand-900">
                        {copied ? 'Skopiowano' : 'Kopiuj numer'}
                    </button>
                    <p className="mt-2 text-xs text-stone-600">Wpisz go w tytule płatności i podawaj przy kontakcie z nami.</p>
                </div>

                <dl className="mx-auto mt-6 max-w-sm space-y-2 text-left text-sm">
                    <div className="flex justify-between rounded-xl bg-brand-50 px-4 py-2">
                        <dt className="text-stone-600">Do zapłaty</dt>
                        <dd className="font-bold text-stone-900">{formatPrice(order.totalPrice)}</dd>
                    </div>
                    <div className="flex justify-between rounded-xl bg-brand-50 px-4 py-2">
                        <dt className="text-stone-600">Płatność</dt>
                        <dd className="font-medium text-stone-900">{PAYMENT_LABELS[order.paymentMethod]}</dd>
                    </div>
                </dl>

                <div className="mt-6 rounded-xl bg-brand-100 p-4 text-left text-sm text-stone-700">
                    <p className="font-semibold text-stone-900">Co dalej?</p>
                    <ol className="mt-2 list-inside list-decimal space-y-1">
                        <li>Wysłaliśmy SMS z potwierdzeniem przyjęcia zamówienia.</li>
                        <li>Gdy zamówienie potwierdzimy, dostaniesz SMS z kwotą i danymi do płatności.</li>
                        <li>Po zaksięgowaniu wpłaty potwierdzimy ją kolejnym SMS-em.</li>
                    </ol>
                </div>

                <Link to="/" className="btn-primary mt-8">
                    Wróć na stronę główną
                </Link>
            </div>
        </div>
    )
}