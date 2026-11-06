import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { api } from '../api/client'
import type { MenuItem } from '../api/types'
import { useCart } from '../cart/cart'
import BoxPreview from '../components/BoxPreview'
import CartSidePanel from '../components/CartSidePanel'
import MenuCard from '../components/MenuCard'
import { BOX_MAX_ITEMS, BOX_MIN_ITEMS } from '../config'
import { site } from '../content'
import { useBoxPrice } from '../hooks/useBoxPrice'

export default function ConfiguratorPage() {
    const [menu, setMenu] = useState<MenuItem[]>([])
    const [loadError, setLoadError] = useState<string | null>(null)
    const [selectedIds, setSelectedIds] = useState<number[]>([])
    const { boxes, addBox } = useCart()
    const [justAdded, setJustAdded] = useState(false)
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
        setJustAdded(false)
        setSelectedIds((current) => {
            if (current.includes(id)) return current.filter((x) => x !== id)
            if (current.length >= BOX_MAX_ITEMS) return current
            return [...current, id]
        })
    }

    function addToCart(): boolean {
        if (!price) return false
        addBox(
            selectedItems.map((i) => ({ id: i.id, name: i.name })),
            price.total,
        )
        return true
    }

    function addAndFinish() {
        if (addToCart()) navigate('/koszyk')
    }

    function addAndComposeNext() {
        if (!addToCart()) return
        setSelectedIds([])
        setJustAdded(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    if (loadError) return <p className="p-6 text-red-600">Nie udało się wczytać menu: {loadError}</p>

    return (
        <div className="mx-auto max-w-6xl px-4 py-8">
            <h1 className="text-3xl font-bold text-stone-900">Skomponuj swój box</h1>
            <p className="mt-1 text-stone-600">
                Wybierz od {BOX_MIN_ITEMS} do {BOX_MAX_ITEMS} pozycji. Cena aktualizuje się na bieżąco.
            </p>
            {justAdded && (
                <p className="mt-3 rounded-xl bg-green-50 px-4 py-2 text-sm text-green-800" role="status">
                    Box dodany do zamówienia. Skomponuj kolejny albo przejdź do koszyka.
                </p>
            )}

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

                <aside className="space-y-4 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto lg:pr-1">
                    <CartSidePanel />
                    <BoxPreview
                        items={selectedItems}
                        price={price}
                        priceLoading={loading}
                        priceError={error}
                        onRemove={toggle}
                        onClear={() => setSelectedIds([])}
                    />
                    <div className="space-y-2">
                        <button type="button" disabled={!canProceed} onClick={addAndComposeNext} className="btn-primary w-full">
                            {boxes.length > 0 ? 'Dodaj ten box i skomponuj kolejny' : 'Dodaj box i skomponuj kolejny'}
                        </button>
                        <button type="button" disabled={!canProceed} onClick={addAndFinish} className="btn-secondary w-full">
                            Dodaj box i przejdź do koszyka
                        </button>
                        {boxes.length > 0 && (
                            <button type="button" onClick={() => navigate('/koszyk')} className="w-full text-sm text-stone-600 underline hover:text-stone-900">
                                Przejdź do koszyka bez dodawania
                            </button>
                        )}
                    </div>
                    <p className="text-center text-xs text-stone-500">{site.pickupInfo}</p>
                </aside>
            </div>
        </div>
    )
}