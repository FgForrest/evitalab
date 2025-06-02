import { BigDecimal } from '@/modules/database-driver/data-type/BigDecimal'
import { HistogramBucket } from '@/modules/database-driver/request-response/data/HistogramBucket'

/**
 * Single histogram bucket DTO ready for visualisation.
 */
export class VisualisedHistogramBucket {
    readonly threshold?: BigDecimal
    readonly occurrences?: number
    readonly requested?: boolean

    constructor(threshold: BigDecimal | undefined,
                occurrences: number | undefined,
                requested: boolean | undefined) {
        this.threshold = threshold
        this.occurrences = occurrences
        this.requested = requested
    }

    static fromInternal(internal: HistogramBucket): VisualisedHistogramBucket {
        return new VisualisedHistogramBucket(
            internal.threshold,
            internal.occurrences,
            internal.requested,
        )
    }

    static fromJson(json: any): VisualisedHistogramBucket {
        return new VisualisedHistogramBucket(
            json.threshold ? new BigDecimal(json.threshold) : undefined,
            json.occurrences,
            json.requested
        )
    }
}
