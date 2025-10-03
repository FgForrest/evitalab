import type { Currency } from '@/modules/database-driver/data-type/Currency.ts'

export class PriceKey {
    readonly priceId: number
    readonly priceList: string
    readonly currency: Currency

    constructor(priceId: number, priceList: string, currency: Currency) {
        this.priceId = priceId
        this.priceList = priceList
        this.currency = currency
    }
}
