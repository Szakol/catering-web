import { createContext, useContext } from 'react'

export const MAX_BOX_QUANTITY = 99

export interface CartItem {
    id: number
    name: string
}

export interface CartBox {
    id: string
    items: CartItem[]
    /** cena jednego boxa z backendu w chwili dodania do koszyka (tylko do wyświetlania) */
    unitPrice: number
    quantity: number
}

export interface CartContextValue {
    boxes: CartBox[]
    count: number
    total: number
    addBox: (items: CartItem[], unitPrice: number) => void
    setQuantity: (boxId: string, quantity: number) => void
    removeBox: (boxId: string) => void
    clear: () => void
}

export const CartContext = createContext<CartContextValue | null>(null)

export function useCart(): CartContextValue {
    const ctx = useContext(CartContext)
    if (!ctx) {
        throw new Error('useCart musi być użyty wewnątrz CartProvider')
    }
    return ctx
}