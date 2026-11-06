import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { formatPrice } from '../../utils/format'
import { adminApi, UnauthorizedError } from '../adminApi'
import { OrderStatusBadge, PaymentStatusBadge } from '../badges'
import {
    FULFILLMENT_LABELS,
    formatDateTime,
    nextStatuses,
    PAYMENT_METHOD_LABELS,
    SMS_TYPE_LABELS,
    SOURCE_LABELS,
    STATUS_LABELS,
} from '../labels'
import type { AdminOrder, OrderStatus, SmsLogEntry } from '../types'

export default function OrderDetailPage() {
    const { id } = useParams()
    const orderId = Number(id)

    const [order, setOrder] = useState<AdminOrder | null>(null)
    const [sms, setSms] = useState<SmsLogEntry[]>([])
    const [loadError, setLoadError] = useState<string | null>(null)
    const [actionError, setActionError] = useState<string | null>(null)
    const [busy, setBusy] = useState(false)

    useEffect(() => {
        if (!Number.isInteger(orderId)) return
        let cancelled = false
        Promise.all([adminApi.getOrder(orderId), adminApi.getSms(orderId)])
            .then(([o, s]) => {
                if (!cancelled) {
                    setOrder(o)
                    setSms(s)
                }
            })
            .catch((e: Error) => {
                if (!cancelled && !(e instanceof UnauthorizedError)) setLoadError(e.message)
            })
        return () => {
            cancelled = true
        }
    }, [orderId])

    async function run(action: () => Promise<AdminOrder>) {
        setBusy(true)
        setActionError(null)
        try {
            const updated = await action()
            setOrder(updated)
            // SMS wychodzi razem z operacją, więc odświeżamy historię
            setSms(await adminApi.getSms(orderId))
        } catch (e) {
            if (!(e instanceof UnauthorizedError)) {
                setActionError(e instanceof Error ? e.message : 'Operacja nie powiodła się')
            }
        } finally {
            setBusy(false)
        }
    }

    function changeStatus(target: OrderStatus) {
        if (target === 'CANCELLED' && !window.confirm('Na pewno anulować zamówienie? Klient dostanie SMS.')) {
            return
        }
        if (
            target === 'IN_PROGRESS' &&
            order?.paymentStatus === 'UNPAID' &&
            !window.confirm('To zamówienie nie jest jeszcze opłacone. Na pewno rozpocząć realizację?')
        ) {
            return
        }
        void run(() => adminApi.changeStatus(orderId, target))
    }

    if (!Number.isInteger(orderId)) {
        return <p className="text-red-600">Niepoprawny numer zamówienia.</p>
    }
    if (loadError) {
        return (
            <div>
                <p className="text-red-600">{loadError}</p>
                <Link to="/admin" className="mt-3 inline-block text-brand-700 underline">
                    Wróć do listy
                </Link>
            </div>
        )
    }
    if (!order) {
        return <p className="text-stone-500">Ładowanie…</p>
    }

    const next = nextStatuses(order)
    const marginPercent = order.totalPrice > 0 ? ((order.margin / order.totalPrice) * 100).toFixed(1).replace('.', ',') : '0'

    return (
        <div>
            <Link to="/admin" className="text-sm text-stone-500 hover:text-stone-800">
                ← Wszystkie zamówienia
            </Link>

            <div className="mt-2 flex flex-wrap items-center gap-3">
                <h1 className="font-mono text-2xl font-bold text-stone-900">{order.orderCode}</h1>
                <OrderStatusBadge status={order.status} />
                <PaymentStatusBadge status={order.paymentStatus} />
                <span className="text-sm text-stone-500">
          złożone {formatDateTime(order.createdAt)} ({SOURCE_LABELS[order.source].toLowerCase()})
        </span>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
                <div className="space-y-6">
                    <section className="rounded-2xl bg-white p-5 shadow-sm">
                        <h2 className="text-lg font-semibold text-stone-900">Klient i odbiór</h2>
                        <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                            <div>
                                <dt className="text-stone-500">Imię i nazwisko</dt>
                                <dd className="font-medium">{order.customerName}</dd>
                            </div>
                            <div>
                                <dt className="text-stone-500">Telefon</dt>
                                <dd className="font-medium">
                                    <a href={`tel:${order.customerPhone}`} className="text-brand-700 hover:underline">
                                        {order.customerPhone}
                                    </a>
                                </dd>
                            </div>
                            <div>
                                <dt className="text-stone-500">E-mail</dt>
                                <dd className="font-medium">
                                    {order.customerEmail ? (
                                        <a href={`mailto:${order.customerEmail}`} className="text-brand-700 hover:underline">
                                            {order.customerEmail}
                                        </a>
                                    ) : (
                                        '—'
                                    )}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-stone-500">{FULFILLMENT_LABELS[order.fulfillmentType]}</dt>
                                <dd className="font-medium">{formatDateTime(order.fulfillmentAt)}</dd>
                            </div>
                            {order.deliveryAddress && (
                                <div className="sm:col-span-2">
                                    <dt className="text-stone-500">Adres dostawy</dt>
                                    <dd className="font-medium">{order.deliveryAddress}</dd>
                                </div>
                            )}
                            {order.notes && (
                                <div className="sm:col-span-2">
                                    <dt className="text-stone-500">Uwagi klienta</dt>
                                    <dd className="whitespace-pre-wrap rounded-lg bg-amber-50 p-2 font-medium">{order.notes}</dd>
                                </div>
                            )}
                        </dl>
                    </section>

                    <section className="rounded-2xl bg-white p-5 shadow-sm">
                        <h2 className="text-lg font-semibold text-stone-900">Zawartość zamówienia</h2>
                        <div className="mt-3 space-y-4">
                            {order.boxes.map((box, index) => (
                                <div key={index} className="rounded-xl border border-stone-200 p-4">
                                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                                        <h3 className="font-semibold text-stone-900">
                                            Box {index + 1} × {box.quantity}
                                        </h3>
                                        <span className="text-sm text-stone-600">
                      {formatPrice(box.unitPrice)} / szt. · koszt {formatPrice(box.unitCost)} ·{' '}
                                            <strong>{formatPrice(box.unitPrice * box.quantity)}</strong>
                    </span>
                                    </div>
                                    <ul className="mt-2 grid gap-x-6 text-sm text-stone-700 sm:grid-cols-2">
                                        {box.items.map((item, i) => (
                                            <li key={i} className="flex justify-between gap-3 border-b border-stone-100 py-1">
                                                <span>{item.name}</span>
                                                <span className="text-stone-500">{formatPrice(item.price)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>

                        <dl className="mt-4 grid gap-2 border-t border-stone-200 pt-4 text-sm sm:grid-cols-3">
                            <div>
                                <dt className="text-stone-500">Wartość zamówienia</dt>
                                <dd className="text-xl font-bold">{formatPrice(order.totalPrice)}</dd>
                            </div>
                            <div>
                                <dt className="text-stone-500">Koszt wytworzenia</dt>
                                <dd className="text-xl font-bold">{formatPrice(order.totalCost)}</dd>
                            </div>
                            <div>
                                <dt className="text-stone-500">Marża</dt>
                                <dd className="text-xl font-bold text-emerald-700">
                                    {formatPrice(order.margin)} <span className="text-sm font-medium">({marginPercent}%)</span>
                                </dd>
                            </div>
                        </dl>
                    </section>
                </div>

                <aside className="space-y-6">
                    <section className="rounded-2xl bg-white p-5 shadow-sm">
                        <h2 className="text-lg font-semibold text-stone-900">Status</h2>
                        {next.length === 0 ? (
                            <p className="mt-2 text-sm text-stone-500">To zamówienie jest zamknięte.</p>
                        ) : (
                            <>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {next.map((target) => (
                                        <button
                                            key={target}
                                            type="button"
                                            disabled={busy}
                                            onClick={() => changeStatus(target)}
                                            className={[
                                                'rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-50',
                                                target === 'CANCELLED'
                                                    ? 'border border-red-300 text-red-700 hover:bg-red-50'
                                                    : 'bg-brand-300 text-brand-900 hover:bg-brand-400',
                                            ].join(' ')}
                                        >
                                            {target === 'CANCELLED' ? 'Anuluj zamówienie' : `→ ${STATUS_LABELS[target]}`}
                                        </button>
                                    ))}
                                </div>
                                <p className="mt-2 text-xs text-stone-500">Zmiana statusu wysyła klientowi SMS (poza zakończeniem).</p>
                            </>
                        )}
                    </section>

                    <section className="rounded-2xl bg-white p-5 shadow-sm">
                        <h2 className="text-lg font-semibold text-stone-900">Płatność</h2>
                        <p className="mt-2 text-sm text-stone-600">
                            {PAYMENT_METHOD_LABELS[order.paymentMethod]}
                            {order.paidAt && <> · wpłata zaksięgowana {formatDateTime(order.paidAt)}</>}
                        </p>
                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => void run(() => adminApi.changePayment(orderId, order.paymentStatus === 'PAID' ? 'UNPAID' : 'PAID'))}
                            className={[
                                'mt-3 w-full rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-50',
                                order.paymentStatus === 'PAID'
                                    ? 'border border-stone-300 text-stone-700 hover:bg-stone-50'
                                    : 'bg-emerald-600 text-white hover:bg-emerald-700',
                            ].join(' ')}
                        >
                            {order.paymentStatus === 'PAID' ? 'Cofnij oznaczenie wpłaty' : 'Oznacz jako opłacone'}
                        </button>
                        {order.paymentStatus === 'UNPAID' && (
                            <p className="mt-2 text-xs text-stone-500">Oznaczenie wpłaty wysyła klientowi SMS z potwierdzeniem.</p>
                        )}
                    </section>

                    {actionError && (
                        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                            {actionError}
                        </p>
                    )}

                    <section className="rounded-2xl bg-white p-5 shadow-sm">
                        <h2 className="text-lg font-semibold text-stone-900">Historia SMS-ów</h2>
                        {sms.length === 0 ? (
                            <p className="mt-2 text-sm text-stone-500">Brak wysłanych wiadomości.</p>
                        ) : (
                            <ul className="mt-3 space-y-3">
                                {sms.map((m) => (
                                    <li key={m.id} className="rounded-lg bg-stone-50 p-3 text-sm">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-medium text-stone-800">{SMS_TYPE_LABELS[m.type]}</span>
                                            <span
                                                className={[
                                                    'rounded-full px-2 py-0.5 text-xs font-semibold',
                                                    m.status === 'SENT' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700',
                                                ].join(' ')}
                                            >
                        {m.status === 'SENT' ? 'wysłany' : 'błąd'}
                      </span>
                                        </div>
                                        <p className="mt-1 text-stone-600">{m.message}</p>
                                        <p className="mt-1 text-xs text-stone-400">{formatDateTime(m.createdAt)}</p>
                                        {m.error && <p className="mt-1 text-xs text-red-600">{m.error}</p>}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </aside>
            </div>
        </div>
    )
}