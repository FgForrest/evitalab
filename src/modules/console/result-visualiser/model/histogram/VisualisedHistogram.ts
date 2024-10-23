import { BigDecimal } from '@/modules/connection/model/data-type/BigDecimal'
import {
    VisualisedHistogramBucket
} from '@/modules/console/result-visualiser/model/histogram/VisualisedHistogramBucket'
import { Histogram } from '@/modules/connection/model/data/Histogram'
import { HistogramBucket } from '@/modules/connection/model/data/HistogramBucket'
import { List } from 'immutable'

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
            .getOrThrow()
            .map((bucket: HistogramBucket) => VisualisedHistogramBucket.fromInternal(bucket))
        return new VisualisedHistogram(
            internal.min.getOrThrow(),
            internal.max.getOrThrow(),
            internal.overallCount.getOrThrow(),
            buckets
        )
    }

    static fromJson(json: any): VisualisedHistogram {
        const buckets = json.buckets.map((bucket: any) => VisualisedHistogramBucket.fromJson(bucket))
        return new VisualisedHistogram(
            json.min ? new BigDecimal(json.min) : undefined,
            json.max ? new BigDecimal(json.max) : undefined,
            json.overallCount ? json.overallCount : undefined,
            List(buckets)
        )
    }
}
