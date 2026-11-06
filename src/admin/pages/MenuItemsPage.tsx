import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { formatPrice } from '../../utils/format'
import { adminApi, UnauthorizedError } from '../adminApi'
import { formatPercent } from '../formUtils'
import type { MenuItemAdmin } from '../types'

export default function MenuItemsPage() {
    const navigate = useNavigate()
    const [items, setItems] = useState<MenuItemAdmin[] | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false
        adminApi
            .listMenuItems()
            .then((list) => {
                if (!cancelled) setItems(list)
            })
            .catch((e: Error) => {
                if (!cancelled && !(e instanceof UnauthorizedError)) setError(e.message)
            })
        return () => {
            cancelled = true
        }
    }, [])

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-2xl font-bold text-stone-900">Menu (potrawy)</h1>
                <Link to="/admin/menu/nowa" className="rounded-lg bg-brand-300 px-4 py-2 text-sm font-semibold text-brand-900 hover:bg-brand-400">
                    + Nowa potrawa
                </Link>
            </div>
            <p className="text-sm text-stone-600">
                Klient składa box z aktywnych potraw. Koszt liczy się z przepisu, a sugerowana cena z docelowej marży.
            </p>

            {error && (
                <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </p>
            )}

            <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
                <table className="w-full min-w-[820px] text-left text-sm">
                    <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                    <tr>
                        <th className="px-4 py-3">Potrawa</th>
                        <th className="px-4 py-3 text-right">Cena</th>
                        <th className="px-4 py-3 text-right">Koszt</th>
                        <th className="px-4 py-3 text-right">Marża</th>
                        <th className="px-4 py-3 text-right">Cel marży</th>
                        <th className="px-4 py-3 text-right">Sugerowana cena</th>
                        <th className="px-4 py-3">Status</th>
                    </tr>
                    </thead>
                    <tbody>
                    {items === null && !error && (
                        <tr>
                            <td colSpan={7} className="px-4 py-10 text-center text-stone-500">
                                Ładowanie…
                            </td>
                        </tr>
                    )}
                    {items !== null && items.length === 0 && (
                        <tr>
                            <td colSpan={7} className="px-4 py-10 text-center text-stone-500">
                                Brak potraw. Dodaj pierwszą.
                            </td>
                        </tr>
                    )}
                    {(items ?? []).map((m) => {
                        const belowTarget = m.marginPercent < m.targetMarginPercent
                        return (
                            <tr
                                key={m.id}
                                onClick={() => navigate(`/admin/menu/${m.id}`)}
                                className="cursor-pointer border-b border-stone-100 last:border-0 hover:bg-brand-50"
                            >
                                <td className="px-4 py-3">
                                    <Link to={`/admin/menu/${m.id}`} className="font-medium text-brand-700 hover:underline">
                                        {m.name}
                                    </Link>
                                    <div className="text-xs text-stone-500">{m.ingredients.length} składników</div>
                                </td>
                                <td className="px-4 py-3 text-right font-semibold">{formatPrice(m.price)}</td>
                                <td className="px-4 py-3 text-right">{formatPrice(m.cost)}</td>
                                <td className="px-4 py-3 text-right">
                    <span className={belowTarget ? 'font-semibold text-amber-700' : 'text-emerald-700'}>
                      {formatPrice(m.margin)} ({formatPercent(m.marginPercent)})
                    </span>
                                    {belowTarget && <div className="text-xs text-amber-700">poniżej celu</div>}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    {formatPercent(m.targetMarginPercent)}
                                    {m.customTargetMargin && <div className="text-xs text-stone-500">własny</div>}
                                </td>
                                <td className="px-4 py-3 text-right">{formatPrice(m.suggestedPrice)}</td>
                                <td className="px-4 py-3">
                    <span
                        className={[
                            'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                            m.active ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600',
                        ].join(' ')}
                    >
                      {m.active ? 'aktywna' : 'ukryta'}
                    </span>
                                </td>
                            </tr>
                        )
                    })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}