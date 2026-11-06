import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatPrice } from '../../utils/format'
import { adminApi, UnauthorizedError } from '../adminApi'
import { formatPercent } from '../formUtils'
import { SOURCE_LABELS, STATUS_LABELS } from '../labels'
import type { Granularity, OrdersBreakdown, StatsSummary, TimelinePoint, TopItem } from '../statsTypes'
import { buildPresets, daysInRange, fillTimeline, formatPeriod } from '../statsUtils'
import type { OrderSource, OrderStatus } from '../types'

const compact = new Intl.NumberFormat('pl-PL', { notation: 'compact', maximumFractionDigits: 1 })

interface Loaded {
    key: string
    from: string
    to: string
    granularity: Granularity
    summary: StatsSummary
    timeline: TimelinePoint[]
    top: TopItem[]
    breakdown: OrdersBreakdown
}

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'good' | 'warn' }) {
    const toneClass = tone === 'good' ? 'text-emerald-700' : tone === 'warn' ? 'text-amber-700' : 'text-stone-900'
    return (
        <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-sm text-stone-500">{label}</p>
            <p className={`mt-1 text-2xl font-bold ${toneClass}`}>{value}</p>
            {sub && <p className="mt-0.5 text-xs text-stone-500">{sub}</p>}
        </div>
    )
}

function Card({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-900">{title}</h2>
            <div className="mt-4">{children}</div>
        </section>
    )
}

function CountList({ rows }: { rows: { label: string; total: number }[] }) {
    const max = Math.max(1, ...rows.map((r) => r.total))
    if (rows.length === 0) return <p className="text-sm text-stone-500">Brak danych.</p>
    return (
        <ul className="space-y-3">
            {rows.map((r) => (
                <li key={r.label}>
                    <div className="flex justify-between text-sm">
                        <span className="text-stone-700">{r.label}</span>
                        <span className="font-semibold text-stone-900">{r.total}</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-brand-100">
                        <div className="h-1.5 rounded-full bg-brand-500" style={{ width: `${(r.total / max) * 100}%` }} />
                    </div>
                </li>
            ))}
        </ul>
    )
}

export default function StatsPage() {
    const presets = useMemo(() => buildPresets(), [])
    const [from, setFrom] = useState(presets[2].from) // domyślnie: ten miesiąc
    const [to, setTo] = useState(presets[2].to)
    const [granularity, setGranularity] = useState<Granularity>('DAY')
    const [data, setData] = useState<Loaded | null>(null)
    const [error, setError] = useState<string | null>(null)

    const rangeValid = from !== '' && to !== '' && from <= to
    const days = rangeValid ? daysInRange(from, to) : 0
    const dayAllowed = days <= 92
    const effective: Granularity = dayAllowed ? granularity : 'MONTH'
    const key = `${from}|${to}|${effective}`

    useEffect(() => {
        if (!rangeValid) return
        let cancelled = false

        Promise.all([
            adminApi.getStatsSummary(from, to),
            adminApi.getStatsTimeline(from, to, effective),
            adminApi.getStatsTopItems(from, to, 10),
            adminApi.getStatsBreakdown(from, to),
        ])
            .then(([summary, timeline, top, breakdown]) => {
                if (!cancelled) {
                    setData({ key, from, to, granularity: effective, summary, timeline, top, breakdown })
                    setError(null)
                }
            })
            .catch((e: Error) => {
                if (!cancelled && !(e instanceof UnauthorizedError)) setError(e.message)
            })

        return () => {
            cancelled = true
        }
    }, [from, to, effective, key, rangeValid])

    const loading = rangeValid && data?.key !== key

    const chartData = useMemo(() => {
        if (!data) return []
        return fillTimeline(data.timeline, data.from, data.to, data.granularity).map((p) => ({
            name: formatPeriod(p.period, data.granularity),
            revenue: p.revenue,
            cost: p.cost,
            margin: p.margin,
        }))
    }, [data])

    const maxQuantity = data ? Math.max(1, ...data.top.map((t) => t.quantity)) : 1

    function applyPreset(f: string, t: string) {
        setFrom(f)
        setTo(t)
    }

    const summary = data?.summary
    const collected = summary && summary.revenue > 0 ? (summary.paidRevenue / summary.revenue) * 100 : 0

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-stone-900">Statystyki</h1>
                <p className="mt-1 text-sm text-stone-600">
                    Okres liczony wg daty realizacji (odbioru) zamówienia, więc obejmuje też zaplanowane zamówienia z przyszłymi
                    terminami. Anulowane zamówienia są pomijane.
                </p>
            </div>

            <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex flex-wrap gap-2">
                    {presets.map((p) => (
                        <button
                            key={p.id}
                            type="button"
                            onClick={() => applyPreset(p.from, p.to)}
                            className={[
                                'rounded-full px-3 py-1.5 text-sm font-medium transition',
                                from === p.from && to === p.to
                                    ? 'bg-brand-600 text-white'
                                    : 'bg-white text-stone-700 ring-1 ring-stone-300 hover:bg-brand-100',
                            ].join(' ')}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>

                <div className="flex flex-wrap items-end gap-4">
                    <label className="text-sm text-stone-600">
                        Od
                        <input className="input mt-1" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                    </label>
                    <label className="text-sm text-stone-600">
                        Do
                        <input className="input mt-1" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                    </label>

                    <div className="text-sm text-stone-600">
                        Wykres w podziale na
                        <div className="mt-1 flex overflow-hidden rounded-xl border border-stone-300">
                            {(['DAY', 'MONTH'] as const).map((g) => (
                                <button
                                    key={g}
                                    type="button"
                                    disabled={g === 'DAY' && !dayAllowed}
                                    onClick={() => setGranularity(g)}
                                    className={[
                                        'px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40',
                                        effective === g ? 'bg-brand-600 text-white' : 'bg-white text-stone-700 hover:bg-brand-50',
                                    ].join(' ')}
                                >
                                    {g === 'DAY' ? 'dni' : 'miesiące'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {!rangeValid && <p className="text-sm text-red-600">Data początkowa nie może być późniejsza niż końcowa.</p>}
                {rangeValid && !dayAllowed && (
                    <p className="text-xs text-stone-500">Dla okresów dłuższych niż 92 dni wykres pokazuje miesiące.</p>
                )}
            </section>

            {error && (
                <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </p>
            )}

            {loading && !data && <p className="text-stone-500">Ładowanie…</p>}

            {data && summary && (
                <div className={loading ? 'space-y-6 opacity-60 transition' : 'space-y-6 transition'}>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                        <Kpi
                            label="Zamówienia"
                            value={String(summary.orders)}
                            sub={summary.orders > 0 ? `średnio ${formatPrice(summary.averageOrderValue)}` : undefined}
                        />
                        <Kpi label="Przychód" value={formatPrice(summary.revenue)} />
                        <Kpi label="Koszt wytworzenia" value={formatPrice(summary.cost)} />
                        <Kpi
                            label="Marża"
                            value={formatPrice(summary.margin)}
                            sub={summary.revenue > 0 ? formatPercent(summary.marginPercent) + ' przychodu' : undefined}
                            tone="good"
                        />
                        <Kpi
                            label="Wpłynęło"
                            value={formatPrice(summary.paidRevenue)}
                            sub={summary.revenue > 0 ? `${formatPercent(collected)} przychodu` : undefined}
                            tone="good"
                        />
                        <Kpi
                            label="Do zapłaty"
                            value={formatPrice(summary.unpaidRevenue)}
                            tone={summary.unpaidRevenue > 0 ? 'warn' : undefined}
                        />
                    </div>

                    {summary.orders === 0 ? (
                        <p className="rounded-2xl bg-white p-8 text-center text-stone-500 shadow-sm">
                            Brak zamówień z terminem realizacji w tym okresie.
                        </p>
                    ) : (
                        <>
                            <Card title="Przychód, koszt i marża w czasie">
                                <div className="h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="name" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
                                            <YAxis tick={{ fontSize: 12 }} width={56} tickFormatter={(v: number) => compact.format(v)} />
                                            <Tooltip formatter={(value) => formatPrice(Number(value))} />
                                            <Legend />
                                            <Bar dataKey="revenue" name="Przychód" fill="#e8678d" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="cost" name="Koszt" fill="#d6d3d1" radius={[4, 4, 0, 0]} />
                                            <Line dataKey="margin" name="Marża" type="monotone" stroke="#059669" strokeWidth={2} dot={false} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>

                            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                                <Card title="Najczęściej wybierane potrawy">
                                    {data.top.length === 0 ? (
                                        <p className="text-sm text-stone-500">Brak danych.</p>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full min-w-[480px] text-left text-sm">
                                                <thead className="text-xs uppercase tracking-wide text-stone-500">
                                                <tr>
                                                    <th className="pb-2">Potrawa</th>
                                                    <th className="pb-2 pr-4">Sztuk</th>
                                                    <th className="pb-2 text-right">Przychód</th>
                                                    <th className="pb-2 text-right">Koszt</th>
                                                    <th className="pb-2 text-right">Marża</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {data.top.map((t) => (
                                                    <tr key={t.name} className="border-t border-stone-100">
                                                        <td className="py-2 pr-3 font-medium text-stone-900">{t.name}</td>
                                                        <td className="w-40 py-2 pr-4">
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-8 font-semibold">{t.quantity}</span>
                                                                <div className="h-1.5 flex-1 rounded-full bg-brand-100">
                                                                    <div
                                                                        className="h-1.5 rounded-full bg-brand-500"
                                                                        style={{ width: `${(t.quantity / maxQuantity) * 100}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-2 text-right">{formatPrice(t.revenue)}</td>
                                                        <td className="py-2 text-right text-stone-600">{formatPrice(t.cost)}</td>
                                                        <td className="py-2 text-right font-semibold text-emerald-700">{formatPrice(t.margin)}</td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </Card>

                                <div className="space-y-6">
                                    <Card title="Zamówienia wg statusu">
                                        <CountList
                                            rows={data.breakdown.byStatus.map((r) => ({
                                                label: STATUS_LABELS[r.label as OrderStatus] ?? r.label,
                                                total: r.total,
                                            }))}
                                        />
                                    </Card>
                                    <Card title="Zamówienia wg źródła">
                                        <CountList
                                            rows={data.breakdown.bySource.map((r) => ({
                                                label: SOURCE_LABELS[r.label as OrderSource] ?? r.label,
                                                total: r.total,
                                            }))}
                                        />
                                    </Card>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    )
}