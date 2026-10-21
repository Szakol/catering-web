import { AnimatePresence, motion } from 'motion/react'
import type { BoxPriceResponse, MenuItem } from '../api/types'
import { BOX_MAX_ITEMS, BOX_MIN_ITEMS } from '../config'
import { formatPrice } from '../utils/format'

interface Props {
    items: MenuItem[]
    price: BoxPriceResponse | null
    priceLoading: boolean
    priceError: string | null
    onRemove: (id: number) => void
    onClear: () => void
}

export default function BoxPreview({ items, price, priceLoading, priceError, onRemove, onClear }: Props) {
    const slots = Array.from({ length: BOX_MAX_ITEMS }, (_, i) => items[i] ?? null)
    const missing = BOX_MIN_ITEMS - items.length

    return (
        <div className="rounded-3xl border-2 border-brand-300 bg-brand-100/70 p-5 shadow-lg">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-stone-900">Twój box</h2>
                {items.length > 0 && (
                    <button type="button" onClick={onClear} className="text-sm text-stone-500 underline hover:text-stone-800">
                        Wyczyść
                    </button>
                )}
            </div>

            <p className="mt-1 text-sm text-stone-600">
                {missing > 0
                    ? `Wybierz jeszcze co najmniej ${missing} ${missing === 1 ? 'pozycję' : 'pozycje'} (do ${BOX_MAX_ITEMS})`
                    : items.length < BOX_MAX_ITEMS
                        ? `Box gotowy. Możesz dodać jeszcze ${BOX_MAX_ITEMS - items.length}.`
                        : 'Box jest pełny.'}
            </p>

            <ul className="mt-4 grid grid-cols-2 gap-3">
                <AnimatePresence initial={false}>
                    {slots.map((item, index) =>
                        item ? (
                            <motion.li
                                key={item.id}
                                layout
                                initial={{ opacity: 0, scale: 0.5, y: -30 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                className="relative flex min-h-20 flex-col justify-between rounded-xl bg-white p-3 shadow"
                            >
                                <span className="pr-5 text-sm font-medium leading-tight text-stone-900">{item.name}</span>
                                <span className="mt-1 text-xs text-stone-500">{formatPrice(item.price)}</span>
                                <button
                                    type="button"
                                    onClick={() => onRemove(item.id)}
                                    aria-label={`Usuń ${item.name}`}
                                    className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-stone-100 text-xs text-stone-500 hover:bg-red-100 hover:text-red-600"
                                >
                                    ✕
                                </button>
                            </motion.li>
                        ) : (
                            <li
                                key={`empty-${index}`}
                                className="flex min-h-20 items-center justify-center rounded-xl border-2 border-dashed border-brand-400 text-xs text-brand-700/70"
                            >
                                {index >= BOX_MIN_ITEMS ? 'opcjonalnie' : 'wolne miejsce'}
                            </li>
                        ),
                    )}
                </AnimatePresence>
            </ul>

            <div className="mt-5 flex items-end justify-between border-t border-brand-300 pt-4">
                <span className="text-sm text-stone-600">Cena boxa</span>
                <div className="h-9 text-right">
                    {priceError ? (
                        <span className="text-sm text-red-600">{priceError}</span>
                    ) : price ? (
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.span
                                key={price.total}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.15 }}
                                className={['block text-3xl font-bold text-stone-900', priceLoading ? 'opacity-50' : ''].join(' ')}
                            >
                                {formatPrice(price.total)}
                            </motion.span>
                        </AnimatePresence>
                    ) : (
                        <span className="text-3xl font-bold text-stone-300">{priceLoading ? '…' : '—'}</span>
                    )}
                </div>
            </div>
        </div>
    )
}