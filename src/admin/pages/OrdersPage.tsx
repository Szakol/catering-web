import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { formatPrice } from '../../utils/format'
import { adminApi, UnauthorizedError } from '../adminApi'
import { OrderStatusBadge, PaymentStatusBadge } from '../badges'
import { formatDateTime, PAYMENT_METHOD_LABELS, SOURCE_LABELS, STATUS_FILTERS } from '../labels'
import type { AdminOrder, OrderStatus } from '../types'

type Filter = 'ALL' | OrderStatus
type Sort = 'created' | 'pickup'

const digits = (s: string) => s.replace(/\D/g, '')
const alnum = (s: string) => s.replace(/[^A-Za-z0-9]/g, '').toUpperCase()

export default function OrdersPage() {
    const navigate = useNavigate()
    const [filter, setFilter] = useState<Filter>('ALL')
    const [search, setSearch] = useState('')
    const [sort, setSort] = useState<Sort>('created')
    const [result, setResult] = useState<{ filter: Filter; orders: AdminOrder[] } | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [tick, setTick] = useState(0)
    const [payingId, setPayingId] = useState<number | null>(null)

    useEffect(() => {
        let cancelled = false
        adminApi
            .listOrders(filter === 'ALL' ? undefined : filter)
            .then((orders) => {
                if (!cancelled) {
                    setResult({ filter, orders })
                    setError(null)
                }
            })
            .catch((e: Error) => {
                if (!cancelled && !(e instanceof UnauthorizedError)) setError(e.message)
            })
        return () => {
            cancelled = true
        }
    }, [filter, tick])

    // odświeżanie listy co 30 sekund (nowe zamówienia pojawiają się same)
    useEffect(() => {
        const timer = setInterval(() => setTick((t) => t + 1), 30_000)
        return () => clearInterval(timer)
    }, [])

    const loading = result?.filter !== filter

    const visible = useMemo(() => {
        const orders = result?.filter === filter ? result.orders : []
        const q = search.trim().toLowerCase()
        const qDigits = digits(q)
        const qCode = alnum(q)

        const filtered = q
            ? orders.filter(
                (o) =>
                    o.customerName.toLowerCase().includes(q) ||
                    (qDigits.length >= 3 && digits(o.customerPhone).includes(qDigits)) ||
                    (qCode.length >= 3 && alnum(o.orderCode).includes(qCode)),
            )
            : orders

        return [...filtered].sort((a, b) =>
            sort === 'pickup'
                ? a.fulfillmentAt.localeCompare(b.fulfillmentAt)
                : b.createdAt.localeCompare(a.createdAt),
        )
    }, [result, filter, search, sort])

    async function markPaid(order: AdminOrder) {
        if (!window.confirm(`Oznaczyć zamówienie ${order.orderCode} jako opłacone? Klient dostanie SMS z potwierdzeniem.`)) {
            return
        }
        setPayingId(order.id)
        setError(null)
        try {
            const updated = await adminApi.changePayment(order.id, 'PAID')
            setResult((current) =>
                current
                    ? { ...current, orders: current.orders.map((o) => (o.id === updated.id ? updated : o)) }
                    : current,
            )
        } catch (e) {
            if (!(e instanceof UnauthorizedError)) {
                setError(e instanceof Error ? e.message : 'Nie udało się oznaczyć wpłaty')
            }
        } finally {
            setPayingId(null)
        }
    }

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-2xl font-bold text-stone-900">Zamówienia</h1>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setTick((t) => t + 1)}
                        className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm hover:bg-stone-50"
                    >
                        Odśwież
                    </button>
                    <Link to="/admin/zamowienia/nowe" className="rounded-lg bg-brand-300 px-4 py-2 text-sm font-semibold text-brand-900 hover:bg-brand-400">
                        + Nowe zamówienie
                    </Link>
                </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                {STATUS_FILTERS.map((f) => (
                    <button
                        key={f.value}
                        type="button"
                        onClick={() => setFilter(f.value)}
                        className={[
                            'rounded-full px-3 py-1.5 text-sm font-medium transition',
                            filter === f.value
                                ? 'bg-brand-600 text-white'
                                : 'bg-white text-stone-700 ring-1 ring-stone-300 hover:bg-brand-100',
                        ].join(' ')}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
                <input
                    className="input max-w-sm"
                    placeholder="Szukaj: numer z przelewu, nazwisko, telefon"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <label className="flex items-center gap-2 text-sm text-stone-600">
                    Sortuj:
                    <select className="input w-auto" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                        <option value="created">najnowsze zamówienia</option>
                        <option value="pickup">najbliższy termin odbioru</option>
                    </select>
                </label>
                {!loading && <span className="text-sm text-stone-500">{visible.length} zamówień</span>}
            </div>

            {error && (
                <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </p>
            )}

            <div className="mt-4 overflow-x-auto rounded-2xl bg-white shadow-sm">
                <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                    <tr>
                        <th className="px-4 py-3">Numer</th>
                        <th className="px-4 py-3">Klient</th>
                        <th className="px-4 py-3">Termin odbioru</th>
                        <th className="px-4 py-3 text-right">Wartość</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Płatność</th>
                        <th className="hidden px-4 py-3 lg:table-cell">Źródło</th>
                    </tr>
                    </thead>
                    <tbody>
                    {loading && (
                        <tr>
                            <td colSpan={7} className="px-4 py-10 text-center text-stone-500">
                                Ładowanie…
                            </td>
                        </tr>
                    )}
                    {!loading && visible.length === 0 && (
                        <tr>
                            <td colSpan={7} className="px-4 py-10 text-center text-stone-500">
                                Brak zamówień do wyświetlenia.
                            </td>
                        </tr>
                    )}
                    {visible.map((o) => (
                        <tr
                            key={o.id}
                            onClick={() => navigate(`/admin/zamowienia/${o.id}`)}
                            className="cursor-pointer border-b border-stone-100 last:border-0 hover:bg-brand-50"
                        >
                            <td className="px-4 py-3 font-mono font-semibold">
                                <Link to={`/admin/zamowienia/${o.id}`} className="text-brand-700 hover:underline">
                                    {o.orderCode}
                                </Link>
                            </td>
                            <td className="px-4 py-3">
                                <div className="font-medium text-stone-900">{o.customerName}</div>
                                <div className="text-xs text-stone-500">{o.customerPhone}</div>
                            </td>
                            <td className="px-4 py-3">{formatDateTime(o.fulfillmentAt)}</td>
                            <td className="px-4 py-3 text-right font-semibold">{formatPrice(o.totalPrice)}</td>
                            <td className="px-4 py-3">
                                <OrderStatusBadge status={o.status} />
                            </td>
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <PaymentStatusBadge status={o.paymentStatus} />
                                    {o.paymentStatus === 'UNPAID' && o.status !== 'CANCELLED' && (
                                        <button
                                            type="button"
                                            disabled={payingId === o.id}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                void markPaid(o)
                                            }}
                                            className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                                        >
                                            {payingId === o.id ? '…' : 'Opłacone'}
                                        </button>
                                    )}
                                </div>
                                <div className="mt-0.5 text-xs text-stone-500">{PAYMENT_METHOD_LABELS[o.paymentMethod]}</div>
                            </td>
                            <td className="hidden px-4 py-3 text-stone-500 lg:table-cell">{SOURCE_LABELS[o.source]}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}