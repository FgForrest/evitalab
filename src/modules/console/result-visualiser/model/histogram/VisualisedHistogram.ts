import {
    VisualisedHistogramBucket
} from '@/modules/console/result-visualiser/model/histogram/VisualisedHistogramBucket'
import { List } from 'immutable'
import { BigDecimal } from '@/modules/database-driver/data-type/BigDecimal'
import { Histogram } from '@/modules/database-driver/request-response/data/Histogram'
import { HistogramBucket } from '@/modules/database-driver/request-response/data/HistogramBucket'

interface HistogramJson {
    buckets: unknown[]
    min?: string
    max?: string
    overallCount?: number
}

/**
 * Single returned histogram DTO ready for visualisation.
 */
export class VisualisedHistogram {
    readonly min?: BigDecimal
    readonly max?: BigDecimal
    readonly overallCount?: number
    readonly buckets: List<VisualisedHistogramBucket>

    constructor(min: BigDecimal | undefined,
                max: BigDecimal | undefined,
                overallCount: number | undefined,
                buckets: List<VisualisedHistogramBucket>) {
        this.min = min
        this.max = max
        this.overallCount = overallCount
        this.buckets = buckets
    }

    static fromInternal(internal: Histogram): VisualisedHistogram {
        const buckets = internal.buckets
            .map((bucket: HistogramBucket) => VisualisedHistogramBucket.fromInternal(bucket))
        return new VisualisedHistogram(
            internal.min,
            internal.max,
            internal.overallCount,
            buckets
        )
    }

    static fromJson(json: unknown): VisualisedHistogram {
        const typedJson = json as HistogramJson
        const buckets = typedJson.buckets.map((bucket: unknown) => VisualisedHistogramBucket.fromJson(bucket))
        return new VisualisedHistogram(
            typedJson.min ? new BigDecimal(typedJson.min) : undefined,
            typedJson.max ? new BigDecimal(typedJson.max) : undefined,
            typedJson.overallCount ? typedJson.overallCount : undefined,
            List(buckets)
        )
    }
}
