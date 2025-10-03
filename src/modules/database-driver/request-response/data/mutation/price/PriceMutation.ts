import type { LocalMutation } from '@/modules/database-driver/request-response/data/mutation/LocalMutation.ts'
import type { PriceKey } from '@/modules/database-driver/request-response/data/mutation/price/PriceKey.ts'

export abstract class PriceMutation implements LocalMutation {
    public readonly priceKey: PriceKey

    constructor(priceKey: PriceKey) {
        this.priceKey = priceKey
    }
}
