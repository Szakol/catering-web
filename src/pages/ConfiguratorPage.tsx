import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { api } from '../api/client'
import type { MenuItem } from '../api/types'
import { useCart } from '../cart/cart'
import BoxPreview from '../components/BoxPreview'
import MenuCard from '../components/MenuCard'
import { BOX_MAX_ITEMS, BOX_MIN_ITEMS } from '../config'
import { useBoxPrice } from '../hooks/useBoxPrice'

export default function ConfiguratorPage() {
    const [menu, setMenu] = useState<MenuItem[]>([])
    const [loadError, setLoadError] = useState<string | null>(null)
    const [selectedIds, setSelectedIds] = useState<number[]>([])
    const { addBox } = useCart()
    const navigate = useNavigate()

    useEffect(() => {
        api.getMenu().then(setMenu).catch((e: Error) => setLoadError(e.message))
    }, [])

    const selectedItems = useMemo(
        () =>
            selectedIds
                .map((id) => menu.find((m) => m.id === id))
                .filter((m): m is MenuItem => m !== undefined),
        [selectedIds, menu],
    )

    const { price, loading, error } = useBoxPrice(selectedIds)

    const full = selectedIds.length >= BOX_MAX_ITEMS
    const canProceed = selectedIds.length >= BOX_MIN_ITEMS && price !== null && !loading

    function toggle(id: number) {
        setSelectedIds((current) => {
            if (current.includes(id)) return current.filter((x) => x !== id)
            if (current.length >= BOX_MAX_ITEMS) return current
            return [...current, id]
        })
    }

    function addToCart() {
        if (!price) return
        addBox(
            selectedItems.map((i) => ({ id: i.id, name: i.name })),
            price.total,
        )
        navigate('/koszyk')
    }

    if (loadError) return <p className="p-6 text-red-600">Nie udało się wczytać menu: {loadError}</p>

    return (
        <div className="mx-auto max-w-6xl px-4 py-8">
            <h1 className="text-3xl font-bold text-stone-900">Skomponuj swój box</h1>
            <p className="mt-1 text-stone-600">
                Wybierz od {BOX_MIN_ITEMS} do {BOX_MAX_ITEMS} pozycji. Cena aktualizuje się na bieżąco.
            </p>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
                <section>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {menu.map((item) => {
                            const selected = selectedIds.includes(item.id)
                            return (
                                <MenuCard
                                    key={item.id}
                                    item={item}
                                    selected={selected}
                                    disabled={full && !selected}
                                    onToggle={toggle}
                                />
                            )
                        })}
                    </div>
                    {menu.length === 0 && <p className="text-stone-500">Menu jest puste.</p>}
                </section>

                <aside className="lg:sticky lg:top-20 lg:self-start">
                    <BoxPreview
                        items={selectedItems}
                        price={price}
                        priceLoading={loading}
                        priceError={error}
                        onRemove={toggle}
                        onClear={() => setSelectedIds([])}
                    />
                    <button type="button" disabled={!canProceed} onClick={addToCart} className="btn-primary mt-4 w-full">
                        Dodaj box do zamówienia
                    </button>
                    <p className="mt-2 text-center text-xs text-stone-500">Odbiór osobisty</p>
                </aside>
            </div>
        </div>
    )
}