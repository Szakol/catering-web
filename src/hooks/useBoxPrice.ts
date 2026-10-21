import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { BoxPriceResponse } from '../api/types'
import { BOX_MAX_ITEMS, BOX_MIN_ITEMS } from '../config'

interface Result {
    key: string
    price: BoxPriceResponse | null
    error: string | null
}

export function useBoxPrice(ids: number[]) {
    const [result, setResult] = useState<Result | null>(null)

    const key = ids.join(',')
    const valid = ids.length >= BOX_MIN_ITEMS && ids.length <= BOX_MAX_ITEMS

    useEffect(() => {
        if (!valid) return

        let cancelled = false
        const timer = setTimeout(() => {
            const list = key.split(',').map(Number)
            api
                .priceBox(list)
                .then((price) => {
                    if (!cancelled) setResult({ key, price, error: null })
                })
                .catch((e: Error) => {
                    if (!cancelled) setResult({ key, price: null, error: e.message })
                })
        }, 250)

        return () => {
            cancelled = true
            clearTimeout(timer)
        }
    }, [key, valid])

    // wynik liczy się tylko, jeśli dotyczy aktualnego wyboru
    const current = valid && result?.key === key ? result : null

    return {
        price: current?.price ?? null,
        error: current?.error ?? null,
        loading: valid && current === null,
    }
}