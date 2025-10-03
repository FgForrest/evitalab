import { PriceMutation } from '@/modules/database-driver/request-response/data/mutation/price/PriceMutation.ts'
import type { PriceKey } from '@/modules/database-driver/request-response/data/mutation/price/PriceKey.ts'

export class RemovePriceMutation extends PriceMutation {
    constructor(priceKey: PriceKey) {
        super(priceKey)
    }
}
