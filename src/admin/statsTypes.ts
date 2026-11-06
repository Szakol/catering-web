export type Granularity = 'DAY' | 'MONTH'

export interface StatsSummary {
    from: string
    to: string
    orders: number
    revenue: number
    cost: number
    margin: number
    marginPercent: number
    averageOrderValue: number
    paidRevenue: number
    unpaidRevenue: number
}

export interface TimelinePoint {
    period: string
    orders: number
    revenue: number
    cost: number
    margin: number
}

export interface TopItem {
    name: string
    quantity: number
    revenue: number
    cost: number
    margin: number
}

export interface CountByLabel {
    label: string
    total: number
}

export interface OrdersBreakdown {
    byStatus: CountByLabel[]
    bySource: CountByLabel[]
}