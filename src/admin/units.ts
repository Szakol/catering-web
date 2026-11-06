import type { Unit } from './types'

export const UNITS: Unit[] = ['KG', 'G', 'L', 'ML', 'PIECE']

export const UNIT_LABELS: Record<Unit, string> = {
    KG: 'kg',
    G: 'g',
    L: 'l',
    ML: 'ml',
    PIECE: 'szt.',
}