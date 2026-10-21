import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { CartContext, MAX_BOX_QUANTITY, type CartBox, type CartContextValue } from './cart'

const STORAGE_KEY = 'cart-v1'

function load(): CartBox[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        return raw ? (JSON.parse(raw) as CartBox[]) : []
    } catch {
        return []
    }
}

function newId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID()
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export default function CartProvider({ children }: { children: ReactNode }) {
    const [boxes, setBoxes] = useState<CartBox[]>(load)

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(boxes))
        } catch {
            /* przeglądarka może blokować localStorage: koszyk działa wtedy tylko do odświeżenia */
        }
    }, [boxes])

    const value = useMemo<CartContextValue>(
        () => ({
            boxes,
            count: boxes.reduce((sum, b) => sum + b.quantity, 0),
            total: Math.round(boxes.reduce((sum, b) => sum + b.unitPrice * b.quantity, 0) * 100) / 100,
            addBox: (items, unitPrice) =>
                setBoxes((current) => [...current, { id: newId(), items, unitPrice, quantity: 1 }]),
            setQuantity: (boxId, quantity) =>
                setBoxes((current) =>
                    current.map((b) =>
                        b.id === boxId ? { ...b, quantity: Math.min(MAX_BOX_QUANTITY, Math.max(1, quantity)) } : b,
                    ),
                ),
            removeBox: (boxId) => setBoxes((current) => current.filter((b) => b.id !== boxId)),
            clear: () => setBoxes([]),
        }),
        [boxes],
    )

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}