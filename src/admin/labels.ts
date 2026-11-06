import type { PaymentMethod } from '../api/types'
import type { FulfillmentType, OrderSource, OrderStatus, PaymentStatus, SmsType } from './types'

export const STATUS_LABELS: Record<OrderStatus, string> = {
    NEW: 'Nowe',
    CONFIRMED: 'Potwierdzone',
    IN_PROGRESS: 'W realizacji',
    READY_FOR_PICKUP: 'Gotowe do odbioru',
    OUT_FOR_DELIVERY: 'W drodze',
    COMPLETED: 'Zakończone',
    CANCELLED: 'Anulowane',
}

export const STATUS_STYLES: Record<OrderStatus, string> = {
    NEW: 'bg-amber-100 text-amber-800',
    CONFIRMED: 'bg-sky-100 text-sky-800',
    IN_PROGRESS: 'bg-indigo-100 text-indigo-800',
    READY_FOR_PICKUP: 'bg-emerald-100 text-emerald-800',
    OUT_FOR_DELIVERY: 'bg-emerald-100 text-emerald-800',
    COMPLETED: 'bg-stone-200 text-stone-700',
    CANCELLED: 'bg-red-100 text-red-700',
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
    UNPAID: 'Nieopłacone',
    PAID: 'Opłacone',
}

export const PAYMENT_STATUS_STYLES: Record<PaymentStatus, string> = {
    UNPAID: 'bg-red-50 text-red-700',
    PAID: 'bg-emerald-100 text-emerald-800',
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
    BLIK_PHONE: 'BLIK na telefon',
    TRANSFER: 'Przelew',
}

export const FULFILLMENT_LABELS: Record<FulfillmentType, string> = {
    PICKUP: 'Odbiór osobisty',
    DELIVERY: 'Dostawa',
}

export const SOURCE_LABELS: Record<OrderSource, string> = {
    WEB: 'Strona',
    ADMIN: 'Ręcznie',
}

export const SMS_TYPE_LABELS: Record<SmsType, string> = {
    ORDER_RECEIVED: 'Zamówienie przyjęte',
    ORDER_CONFIRMED: 'Zamówienie potwierdzone',
    ORDER_IN_PROGRESS: 'W trakcie przygotowania',
    ORDER_READY_FOR_PICKUP: 'Gotowe do odbioru',
    ORDER_OUT_FOR_DELIVERY: 'W drodze',
    ORDER_CANCELLED: 'Zamówienie anulowane',
    PAYMENT_RECEIVED: 'Wpłata otrzymana',
    PAYMENT_REMINDER: 'Przypomnienie o płatności',
}

export const STATUS_FILTERS: { value: 'ALL' | OrderStatus; label: string }[] = [
    { value: 'ALL', label: 'Wszystkie' },
    { value: 'NEW', label: STATUS_LABELS.NEW },
    { value: 'CONFIRMED', label: STATUS_LABELS.CONFIRMED },
    { value: 'IN_PROGRESS', label: STATUS_LABELS.IN_PROGRESS },
    { value: 'READY_FOR_PICKUP', label: STATUS_LABELS.READY_FOR_PICKUP },
    { value: 'OUT_FOR_DELIVERY', label: STATUS_LABELS.OUT_FOR_DELIVERY },
    { value: 'COMPLETED', label: STATUS_LABELS.COMPLETED },
    { value: 'CANCELLED', label: STATUS_LABELS.CANCELLED },
]

/** Dozwolone następne statusy: lustro reguł z backendu (backend i tak je sprawdza). */
export function nextStatuses(order: { status: OrderStatus; fulfillmentType: FulfillmentType }): OrderStatus[] {
    switch (order.status) {
        case 'NEW':
            return ['CONFIRMED', 'CANCELLED']
        case 'CONFIRMED':
            return ['IN_PROGRESS', 'CANCELLED']
        case 'IN_PROGRESS':
            return [order.fulfillmentType === 'PICKUP' ? 'READY_FOR_PICKUP' : 'OUT_FOR_DELIVERY', 'CANCELLED']
        case 'READY_FOR_PICKUP':
        case 'OUT_FOR_DELIVERY':
            return ['COMPLETED', 'CANCELLED']
        default:
            return []
    }
}

export function formatDateTime(iso: string): string {
    return new Date(iso).toLocaleString('pl-PL', { dateStyle: 'medium', timeStyle: 'short' })
}