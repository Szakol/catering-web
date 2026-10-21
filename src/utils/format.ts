const formatter = new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
})

export const formatPrice = (value: number) => formatter.format(value)