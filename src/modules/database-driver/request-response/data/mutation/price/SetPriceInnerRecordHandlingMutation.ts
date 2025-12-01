export class SetPriceInnerRecordHandlingMutation implements LocalMutation {
    readonly priceInnerRecordHandling: PriceInnerRecordHandling

    constructor(priceInnerRecordHandling: PriceInnerRecordHandling) {
        this.priceInnerRecordHandling = priceInnerRecordHandling
    }
}
import type { PriceInnerRecordHandling } from '@/modules/database-driver/data-type/PriceInnerRecordHandling.ts'

import type { LocalMutation } from '@/modules/database-driver/request-response/data/mutation/LocalMutation.ts'
