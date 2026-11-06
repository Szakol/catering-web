import type {
    AdminCreateOrderRequest,
    AdminOrder,
    MenuItemAdmin,
    MenuItemRequest,
    OrderStatus,
    PaymentStatus,
    PricingSettings,
    Product,
    ProductRequest,
    SmsLogEntry,
} from './types'
import type { Granularity, OrdersBreakdown, StatsSummary, TimelinePoint, TopItem } from './statsTypes'

const STORAGE_KEY = 'admin-auth'

// Dane logowania trzymamy tylko na czas sesji przeglądarki (znikają po zamknięciu karty).
export function getToken(): string | null {
    try {
        return sessionStorage.getItem(STORAGE_KEY)
    } catch {
        return null
    }
}

export function saveToken(token: string): void {
    try {
        sessionStorage.setItem(STORAGE_KEY, token)
    } catch {
        /* sessionStorage zablokowany: sesja będzie działać do odświeżenia strony */
    }
}

export function clearToken(): void {
    try {
        sessionStorage.removeItem(STORAGE_KEY)
    } catch {
        /* brak */
    }
}

export class UnauthorizedError extends Error {
    constructor() {
        super('Brak autoryzacji')
        this.name = 'UnauthorizedError'
    }
}

const unauthorizedListeners = new Set<() => void>()

export function subscribeUnauthorized(listener: () => void): () => void {
    unauthorizedListeners.add(listener)
    return () => {
        unauthorizedListeners.delete(listener)
    }
}

async function adminRequest<T>(url: string, init: RequestInit = {}, tokenOverride?: string): Promise<T> {
    const token = tokenOverride ?? getToken()
    const headers = new Headers(init.headers)
    headers.set('Content-Type', 'application/json')
    if (token) {
        headers.set('Authorization', `Basic ${token}`)
    }

    const res = await fetch(url, { ...init, headers })

    if (res.status === 401) {
        if (!tokenOverride) {
            clearToken()
            unauthorizedListeners.forEach((listener) => listener())
        }
        throw new UnauthorizedError()
    }

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

    // np. DELETE zwraca 204 bez treści
    if (res.status === 204) {
        return undefined as T
    }

    return res.json() as Promise<T>
}

export const adminApi = {
    /** Sprawdza dane logowania (lekki endpoint admina). */
    verify: (token: string) => adminRequest<unknown>('/api/admin/settings/pricing', {}, token),

    // zamówienia
    listOrders: (status?: OrderStatus) =>
        adminRequest<AdminOrder[]>(`/api/admin/orders${status ? `?status=${status}` : ''}`),

    getOrder: (id: number) => adminRequest<AdminOrder>(`/api/admin/orders/${id}`),

    createOrder: (order: AdminCreateOrderRequest) =>
        adminRequest<AdminOrder>('/api/admin/orders', { method: 'POST', body: JSON.stringify(order) }),

    changeStatus: (id: number, status: OrderStatus) =>
        adminRequest<AdminOrder>(`/api/admin/orders/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        }),

    changePayment: (id: number, paymentStatus: PaymentStatus) =>
        adminRequest<AdminOrder>(`/api/admin/orders/${id}/payment`, {
            method: 'PATCH',
            body: JSON.stringify({ paymentStatus }),
        }),

    getSms: (id: number) => adminRequest<SmsLogEntry[]>(`/api/admin/orders/${id}/sms`),

    // produkty
    listProducts: () => adminRequest<Product[]>('/api/admin/products'),

    createProduct: (product: ProductRequest) =>
        adminRequest<Product>('/api/admin/products', { method: 'POST', body: JSON.stringify(product) }),

    updateProduct: (id: number, product: ProductRequest) =>
        adminRequest<Product>(`/api/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(product) }),

    deleteProduct: (id: number) => adminRequest<void>(`/api/admin/products/${id}`, { method: 'DELETE' }),

    // potrawy
    listMenuItems: () => adminRequest<MenuItemAdmin[]>('/api/admin/menu-items'),

    getMenuItem: (id: number) => adminRequest<MenuItemAdmin>(`/api/admin/menu-items/${id}`),

    createMenuItem: (item: MenuItemRequest) =>
        adminRequest<MenuItemAdmin>('/api/admin/menu-items', { method: 'POST', body: JSON.stringify(item) }),

    updateMenuItem: (id: number, item: MenuItemRequest) =>
        adminRequest<MenuItemAdmin>(`/api/admin/menu-items/${id}`, { method: 'PUT', body: JSON.stringify(item) }),

    deleteMenuItem: (id: number) => adminRequest<void>(`/api/admin/menu-items/${id}`, { method: 'DELETE' }),

    // marża
    getPricingSettings: () => adminRequest<PricingSettings>('/api/admin/settings/pricing'),

    updatePricingSettings: (defaultMarginPercent: number) =>
        adminRequest<PricingSettings>('/api/admin/settings/pricing', {
            method: 'PUT',
            body: JSON.stringify({ defaultMarginPercent }),
        }),

    // statystyki
    getStatsSummary: (from: string, to: string) =>
        adminRequest<StatsSummary>(`/api/admin/stats/summary?from=${from}&to=${to}`),

    getStatsTimeline: (from: string, to: string, granularity: Granularity) =>
        adminRequest<TimelinePoint[]>(`/api/admin/stats/timeline?from=${from}&to=${to}&granularity=${granularity}`),

    getStatsTopItems: (from: string, to: string, limit = 10) =>
        adminRequest<TopItem[]>(`/api/admin/stats/top-items?from=${from}&to=${to}&limit=${limit}`),

    getStatsBreakdown: (from: string, to: string) =>
        adminRequest<OrdersBreakdown>(`/api/admin/stats/orders-breakdown?from=${from}&to=${to}`),
}