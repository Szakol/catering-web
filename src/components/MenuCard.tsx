import type { MenuItem } from '../api/types'
import { formatPrice } from '../utils/format'

interface Props {
    item: MenuItem
    selected: boolean
    disabled: boolean
    onToggle: (id: number) => void
}

export default function MenuCard({ item, selected, disabled, onToggle }: Props) {
    return (
        <button
            type="button"
            onClick={() => onToggle(item.id)}
            disabled={disabled}
            aria-pressed={selected}
            className={[
                'flex h-full flex-col rounded-2xl border-2 p-4 text-left transition',
                selected
                    ? 'border-brand-500 bg-brand-100 shadow-md'
                    : 'border-stone-200 bg-white hover:border-brand-300 hover:shadow',
                disabled ? 'cursor-not-allowed opacity-40 hover:border-stone-200 hover:shadow-none' : 'cursor-pointer',
            ].join(' ')}
        >
            <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-semibold text-stone-900">{item.name}</h3>
                <span
                    className={[
                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                        selected ? 'bg-brand-600 text-white' : 'bg-stone-100 text-stone-400',
                    ].join(' ')}
                >
          {selected ? '✓' : '+'}
        </span>
            </div>
            {item.description && <p className="mt-1 flex-1 text-sm text-stone-600">{item.description}</p>}
            <p className="mt-3 font-medium text-stone-800">{formatPrice(item.price)}</p>
        </button>
    )
}