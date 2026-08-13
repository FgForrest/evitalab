import type { GraphQLResultNode } from '@/modules/database-driver/connector/gql/model/GraphQLResultNode'
import {
    VisualisedHistogramBucket
} from '@/modules/console/result-visualiser/model/histogram/VisualisedHistogramBucket'
import { List } from 'immutable'
import { BigDecimal } from '@/modules/database-driver/data-type/BigDecimal'
import { Histogram } from '@/modules/database-driver/request-response/data/Histogram'
import { HistogramBucket } from '@/modules/database-driver/request-response/data/HistogramBucket'

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

    static fromJson(json: GraphQLResultNode): VisualisedHistogram {
        const buckets = json.buckets.map((bucket: GraphQLResultNode) => VisualisedHistogramBucket.fromJson(bucket))
        return new VisualisedHistogram(
            json.min != undefined ? new BigDecimal(json.min) : undefined,
            json.max != undefined ? new BigDecimal(json.max) : undefined,
            json.overallCount,
            List(buckets)
        )
    }
}
