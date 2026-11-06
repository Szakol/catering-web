import { Link, useNavigate } from 'react-router'
import { MAX_BOX_QUANTITY, useCart } from '../cart/cart'
import { site } from '../content'
import { formatPrice } from '../utils/format'

export default function CartPage() {
    const { boxes, total, setQuantity, removeBox } = useCart()
    const navigate = useNavigate()

    if (boxes.length === 0) {
        return (
            <div className="mx-auto max-w-xl px-4 py-24 text-center">
                <h1 className="text-3xl font-bold text-stone-900">Twój koszyk jest pusty</h1>
                <p className="mt-3 text-stone-600">Skomponuj pierwszy box, a pojawi się tutaj.</p>
                <Link to="/zamow" className="btn-primary mt-6">
                    Skomponuj box
                </Link>
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-6xl px-4 py-8">
            <h1 className="text-3xl font-bold text-stone-900">Twoje zamówienie</h1>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
                <ul className="space-y-4">
                    {boxes.map((box, index) => (
                        <li key={box.id} className="rounded-2xl bg-white p-5 shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                                <h2 className="text-lg font-semibold text-stone-900">Box {index + 1}</h2>
                                <button
                                    type="button"
                                    onClick={() => removeBox(box.id)}
                                    className="text-sm text-stone-500 underline hover:text-red-600"
                                >
                                    Usuń
                                </button>
                            </div>

                            <ul className="mt-2 list-inside list-disc text-sm text-stone-600">
                                {box.items.map((item) => (
                                    <li key={item.id}>{item.name}</li>
                                ))}
                            </ul>

                            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-4">
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        aria-label="Mniej"
                                        disabled={box.quantity <= 1}
                                        onClick={() => setQuantity(box.id, box.quantity - 1)}
                                        className="h-8 w-8 rounded-full border border-stone-300 text-lg leading-none hover:bg-brand-100 disabled:opacity-40"
                                    >
                                        −
                                    </button>
                                    <span className="w-8 text-center font-semibold">{box.quantity}</span>
                                    <button
                                        type="button"
                                        aria-label="Więcej"
                                        disabled={box.quantity >= MAX_BOX_QUANTITY}
                                        onClick={() => setQuantity(box.id, box.quantity + 1)}
                                        className="h-8 w-8 rounded-full border border-stone-300 text-lg leading-none hover:bg-brand-100 disabled:opacity-40"
                                    >
                                        +
                                    </button>
                                    <span className="ml-1 text-sm text-stone-500">× {formatPrice(box.unitPrice)}</span>
                                </div>
                                <span className="text-lg font-bold text-stone-900">
                  {formatPrice(box.unitPrice * box.quantity)}
                </span>
                            </div>
                        </li>
                    ))}
                </ul>

                <aside className="lg:sticky lg:top-20 lg:self-start">
                    <div className="rounded-3xl border-2 border-brand-300 bg-brand-100/70 p-5 shadow-lg">
                        <div className="flex items-end justify-between">
                            <span className="text-stone-600">Razem</span>
                            <span className="text-3xl font-bold text-stone-900">{formatPrice(total)}</span>
                        </div>
                        <p className="mt-2 text-xs text-stone-500">
                            Ostateczną kwotę potwierdzimy po złożeniu zamówienia. {site.pickupInfo}.
                        </p>
                    </div>

                    <button type="button" onClick={() => navigate('/zamowienie')} className="btn-primary mt-4 w-full">
                        Dalej: dane do zamówienia
                    </button>
                    <Link to="/zamow" className="btn-secondary mt-3 block w-full text-center">
                        Dodaj kolejny box
                    </Link>
                </aside>
            </div>
        </div>
    )
}