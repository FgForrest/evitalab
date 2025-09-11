import type { PriceInnerRecordHandling } from '@/modules/database-driver/data-type/PriceInnerRecordHandling.ts'

export class SetPriceInnerRecordHandlingMutation {
    readonly priceInnerRecordHandling: PriceInnerRecordHandling

    constructor(priceInnerRecordHandling: PriceInnerRecordHandling) {
        this.priceInnerRecordHandling = priceInnerRecordHandling
    }
}
