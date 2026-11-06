export type PaymentMethod = 'BLIK_PHONE' | 'TRANSFER'
export type FulfillmentType = 'PICKUP' | 'DELIVERY'

export interface MenuItem {
    id: number
    name: string
    description: string | null
    price: number
}

export interface BoxPriceItem {
    id: number
    name: string
    price: number
}

export interface BoxPriceResponse {
    itemCount: number
    items: BoxPriceItem[]
    total: number
}

export interface CreateOrderRequest {
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

export interface OrderConfirmation {
    orderCode: string
    status: string
    paymentMethod: PaymentMethod
    totalPrice: number
}
