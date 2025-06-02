import { BigDecimal } from '@/modules/database-driver/data-type/BigDecimal'

/**
 * Method returns gross estimation of the in-memory size of this instance. The estimation is expected not to be
 * a precise one.
 */
export class HistogramBucket {
    readonly threshold: BigDecimal
    readonly occurrences: number
    readonly requested: boolean

    constructor(occurrences: number,
                requested: boolean,
                threshold: BigDecimal){
        this.threshold = threshold
        this.occurrences = occurrences
        this.requested = requested
    }
}
