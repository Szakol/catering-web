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

export type PaymentMethod = 'BLIK_PHONE' | 'TRANSFER'

export interface OrderBoxRequest {
    quantity: number
    menuItemIds: number[]
}

export interface CreateOrderRequest {
    customerName: string
    customerPhone: string
    customerEmail?: string
    fulfillmentType: 'PICKUP'
    fulfillmentAt: string
    notes?: string
    paymentMethod: PaymentMethod
    boxes: OrderBoxRequest[]
}

export interface OrderConfirmation {
    orderCode: string
    status: string
    paymentMethod: PaymentMethod
    totalPrice: number
}