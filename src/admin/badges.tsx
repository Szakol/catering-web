import { PAYMENT_STATUS_LABELS, PAYMENT_STATUS_STYLES, STATUS_LABELS, STATUS_STYLES } from './labels'
import type { OrderStatus, PaymentStatus } from './types'

const base = 'inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold'

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
    return <span className={`${base} ${STATUS_STYLES[status]}`}>{STATUS_LABELS[status]}</span>
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
    return <span className={`${base} ${PAYMENT_STATUS_STYLES[status]}`}>{PAYMENT_STATUS_LABELS[status]}</span>
}