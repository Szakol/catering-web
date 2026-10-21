import type { BoxPriceResponse, CreateOrderRequest, MenuItem, OrderConfirmation } from './types'

async function request<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        ...init,
    })
    if (!res.ok) {
        let detail = `Błąd ${res.status}`
        try {
            const body = await res.json()
            detail = body.detail ?? detail
        } catch {
            /* brak treści JSON */
        }
        throw new Error(detail)
    }
    return res.json() as Promise<T>
}

export const api = {
    getMenu: () => request<MenuItem[]>('/api/menu'),
    priceBox: (menuItemIds: number[]) =>
        request<BoxPriceResponse>('/api/box/price', {
            method: 'POST',
            body: JSON.stringify({ menuItemIds }),
        }),
    createOrder: (order: CreateOrderRequest) =>
        request<OrderConfirmation>('/api/orders', {
            method: 'POST',
            body: JSON.stringify(order),
        }),
}