import type { PaymentMethod } from '../api/types'

export type OrderStatus =
    | 'NEW'
    | 'CONFIRMED'
    | 'IN_PROGRESS'
    | 'READY_FOR_PICKUP'
    | 'OUT_FOR_DELIVERY'
    | 'COMPLETED'
    | 'CANCELLED'

export type PaymentStatus = 'UNPAID' | 'PAID'
export type FulfillmentType = 'PICKUP' | 'DELIVERY'
export type OrderSource = 'WEB' | 'ADMIN'
export type SmsStatus = 'SENT' | 'FAILED'
export type SmsType =
    | 'ORDER_RECEIVED'
    | 'ORDER_CONFIRMED'
    | 'ORDER_IN_PROGRESS'
    | 'ORDER_READY_FOR_PICKUP'
    | 'ORDER_OUT_FOR_DELIVERY'
    | 'ORDER_CANCELLED'
    | 'PAYMENT_RECEIVED'
    | 'PAYMENT_REMINDER'

export interface AdminOrderItem {
    menuItemId: number | null
    name: string
    price: number
    cost: number
}

export interface AdminOrderBox {
    quantity: number
    unitPrice: number
    unitCost: number
    items: AdminOrderItem[]
}

export interface AdminOrder {
    id: number
    orderCode: string
    status: OrderStatus
    paymentStatus: PaymentStatus
    paymentMethod: PaymentMethod
    paidAt: string | null
    source: OrderSource
    createdAt: string
    customerName: string
    customerPhone: string
    customerEmail: string | null
    fulfillmentType: FulfillmentType
    deliveryAddress: string | null
    fulfillmentAt: string
    notes: string | null
    totalPrice: number
    totalCost: number
    margin: number
    boxes: AdminOrderBox[]
}

export interface SmsLogEntry {
    id: number
    type: SmsType
    phone: string
    message: string
    status: SmsStatus
    error: string | null
    createdAt: string
}

export interface AdminCreateOrderRequest {
    customerName: string
    customerPhone: string
    customerEmail?: string
    fulfillmentType: FulfillmentType
    deliveryAddress?: string
    fulfillmentAt: string
    notes?: string
    paymentMethod: PaymentMethod
    boxes: { quantity: number; menuItemIds: number[] }[]
}

// ---------- katalog ----------

export type Unit = 'KG' | 'G' | 'L' | 'ML' | 'PIECE'

export interface Product {
    id: number
    name: string
    unit: Unit
    costPerUnit: number
    active: boolean
}

export interface ProductRequest {
    name: string
    unit: Unit
    costPerUnit: number
    active: boolean
}

export interface IngredientRequest {
    productId: number
    quantity: number
}

export interface Ingredient {
    productId: number
    productName: string
    unit: Unit
    quantity: number
}

export interface MenuItemAdmin {
    id: number
    name: string
    description: string | null
    price: number
    active: boolean
    sortOrder: number
    cost: number
    margin: number
    marginPercent: number
    targetMarginPercent: number
    customTargetMargin: boolean
    suggestedPrice: number
    ingredients: Ingredient[]
}

export interface MenuItemRequest {
    name: string
    description?: string
    price: number
    marginPercent: number | null
    active: boolean
    sortOrder: number
    ingredients: IngredientRequest[]
}

export interface PricingSettings {
    defaultMarginPercent: number
}