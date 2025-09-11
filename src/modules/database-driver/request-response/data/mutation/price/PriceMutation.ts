import type { PriceKey } from '@/modules/database-driver/request-response/data/mutation/PriceKey.ts'

export class PriceMutation  {
    protected readonly priceKey: PriceKey

    constructor(priceKey: PriceKey) {
        this.priceKey = priceKey
    }
}
