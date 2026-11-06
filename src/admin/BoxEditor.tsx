import type { MenuItem } from '../api/types'
import { BOX_MAX_ITEMS, BOX_MIN_ITEMS } from '../config'
import { useBoxPrice } from '../hooks/useBoxPrice'
import { formatPrice } from '../utils/format'

interface Props {
    index: number
    menu: MenuItem[]
    ids: number[]
    quantity: number
    canRemove: boolean
    onToggle: (id: number) => void
    onQuantity: (quantity: number) => void
    onRemove: () => void
}

export default function BoxEditor({ index, menu, ids, quantity, canRemove, onToggle, onQuantity, onRemove }: Props) {
    const { price, loading, error } = useBoxPrice(ids)
    const full = ids.length >= BOX_MAX_ITEMS
    const valid = ids.length >= BOX_MIN_ITEMS

    return (
        <div className="rounded-xl border border-stone-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-semibold text-stone-900">Box {index + 1}</h3>
                <div className="flex items-center gap-4 text-sm">
                    <label className="flex items-center gap-2">
                        Ilość:
                        <input
                            className="input w-20"
                            type="number"
                            min={1}
                            max={99}
                            value={quantity}
                            onChange={(e) => onQuantity(Math.min(99, Math.max(1, Number(e.target.value) || 1)))}
                        />
                    </label>
                    {canRemove && (
                        <button type="button" onClick={onRemove} className="text-stone-500 underline hover:text-red-600">
                            Usuń box
                        </button>
                    )}
                </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
                {menu.map((item) => {
                    const selected = ids.includes(item.id)
                    return (
                        <button
                            key={item.id}
                            type="button"
                            disabled={full && !selected}
                            onClick={() => onToggle(item.id)}
                            aria-pressed={selected}
                            className={[
                                'rounded-full px-3 py-1.5 text-sm transition',
                                selected
                                    ? 'bg-brand-600 text-white'
                                    : 'bg-white text-stone-700 ring-1 ring-stone-300 hover:bg-brand-100',
                                full && !selected ? 'cursor-not-allowed opacity-40' : '',
                            ].join(' ')}
                        >
                            {item.name}
                        </button>
                    )
                })}
            </div>

            <p className="mt-3 text-sm">
        <span className={valid ? 'text-emerald-700' : 'text-stone-500'}>
          Wybrano {ids.length} z {BOX_MIN_ITEMS}–{BOX_MAX_ITEMS}
        </span>
                {error && <span className="ml-3 text-red-600">{error}</span>}
                {price && !error && (
                    <span className={['ml-3 font-semibold text-stone-900', loading ? 'opacity-50' : ''].join(' ')}>
            Cena boxa: {formatPrice(price.total)}
          </span>
                )}
            </p>
        </div>
    )
}