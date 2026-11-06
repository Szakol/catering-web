export const PHONE_RE = /^[+0-9 ()-]{9,20}$/
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Dzisiejsza data w czasie lokalnym, format RRRR-MM-DD. */
export function todayIso(): string {
    return new Date().toLocaleDateString('sv-SE')
}

/** Liczba z pola tekstowego; akceptuje przecinek ("12,5"). Pusty tekst daje NaN. */
export function parseDecimal(value: string): number {
    const trimmed = value.trim().replace(',', '.')
    return trimmed === '' ? Number.NaN : Number(trimmed)
}

export function round2(value: number): number {
    return Math.round(value * 100) / 100
}

export function formatPercent(value: number): string {
    return `${value.toFixed(1).replace('.', ',')}%`
}