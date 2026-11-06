import { Link } from 'react-router'
import { useCart } from '../cart/cart'
import { formatPrice } from '../utils/format'

/** Boxy już dodane do zamówienia: widoczne obok konfiguratora kolejnego boxa. */
export default function CartSidePanel() {
    const { boxes, total, removeBox } = useCart()

    if (boxes.length === 0) return null

    return (
        <div className="rounded-3xl border border-brand-200 bg-white p-5 shadow">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-stone-900">Już w zamówieniu</h2>
                <Link to="/koszyk" className="text-sm text-brand-700 underline hover:text-brand-900">
                    Koszyk
                </Link>
            </div>

            <ul className="mt-3 space-y-3">
                {boxes.map((box, index) => (
                    <li key={box.id} className="rounded-xl bg-brand-50 p-3">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <p className="text-sm font-semibold text-stone-900">
                                    Box {index + 1}
                                    {box.quantity > 1 && <span className="font-normal text-stone-500"> × {box.quantity}</span>}
                                </p>
                                <p className="text-xs text-stone-500">
                                    {formatPrice(box.unitPrice)} / szt.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => removeBox(box.id)}
                                className="text-xs text-stone-500 underline hover:text-red-600"
                            >
                                Usuń
                            </button>
                        </div>
                        <ul className="mt-2 list-disc pl-4 text-xs leading-relaxed text-stone-700">
                            {box.items.map((item, i) => (
                                <li key={`${item.id}-${i}`}>{item.name}</li>
                            ))}
                        </ul>
                    </li>
                ))}
            </ul>

            <div className="mt-3 flex items-end justify-between border-t border-brand-200 pt-3">
                <span className="text-sm text-stone-600">Razem</span>
                <span className="text-xl font-bold text-stone-900">{formatPrice(total)}</span>
            </div>
        </div>
    )
}
