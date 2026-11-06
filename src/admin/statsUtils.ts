import type { Granularity, TimelinePoint } from './statsTypes'

const pad = (n: number) => String(n).padStart(2, '0')

const MONTHS = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru']

/** Data lokalna w formacie RRRR-MM-DD (bez przesunięć strefy czasowej). */
export function isoLocal(d: Date): string {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function parseIso(s: string): Date {
    const [y, m, d] = s.split('-').map(Number)
    return new Date(y, m - 1, d)
}

export function daysInRange(from: string, to: string): number {
    return Math.round((parseIso(to).getTime() - parseIso(from).getTime()) / 86_400_000) + 1
}

export interface Preset {
    id: string
    label: string
    from: string
    to: string
}

export function buildPresets(now: Date = new Date()): Preset[] {
    const y = now.getFullYear()
    const m = now.getMonth()
    const daysAgo = (n: number) => new Date(y, m, now.getDate() - n)

    return [
        { id: '7d', label: 'Ostatnie 7 dni', from: isoLocal(daysAgo(6)), to: isoLocal(now) },
        { id: '30d', label: 'Ostatnie 30 dni', from: isoLocal(daysAgo(29)), to: isoLocal(now) },
        { id: 'month', label: 'Ten miesiąc', from: isoLocal(new Date(y, m, 1)), to: isoLocal(new Date(y, m + 1, 0)) },
        { id: 'prev', label: 'Poprzedni miesiąc', from: isoLocal(new Date(y, m - 1, 1)), to: isoLocal(new Date(y, m, 0)) },
        { id: 'year', label: 'Ten rok', from: isoLocal(new Date(y, 0, 1)), to: isoLocal(new Date(y, 11, 31)) },
    ]
}

/** Backend zwraca tylko okresy z zamówieniami, a wykres potrzebuje ciągłej osi, więc uzupełniamy zerami. */
export function fillTimeline(
    points: TimelinePoint[],
    from: string,
    to: string,
    granularity: Granularity,
): TimelinePoint[] {
    const byPeriod = new Map(points.map((p) => [p.period, p]))
    const empty = (period: string): TimelinePoint => ({ period, orders: 0, revenue: 0, cost: 0, margin: 0 })
    const result: TimelinePoint[] = []
    const end = parseIso(to)

    if (granularity === 'DAY') {
        for (const d = parseIso(from); d <= end; d.setDate(d.getDate() + 1)) {
            const key = isoLocal(d)
            result.push(byPeriod.get(key) ?? empty(key))
        }
    } else {
        const start = parseIso(from)
        for (
            let d = new Date(start.getFullYear(), start.getMonth(), 1);
            d <= end;
            d = new Date(d.getFullYear(), d.getMonth() + 1, 1)
        ) {
            const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
            result.push(byPeriod.get(key) ?? empty(key))
        }
    }

    return result
}

export function formatPeriod(period: string, granularity: Granularity): string {
    const [y, m, d] = period.split('-').map(Number)
    return granularity === 'DAY' ? `${d}.${pad(m)}` : `${MONTHS[m - 1]} ${y}`
}