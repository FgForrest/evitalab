import { HistogramBucket } from "./HistogramBucket";
import { List } from "immutable";
import { BigDecimal } from '@/modules/database-driver/data-type/BigDecimal'

/**
 * A histogram is an approximate representation of the distribution of numerical data. For detailed description please
 * see <a href="https://en.wikipedia.org/wiki/Histogram">Wikipedia</a>.
 * Histogram can be computed only for numeric based properties. It visualises which property values are more common
 * in the returned data set and which are rare. Bucket count will never exceed requested bucket count specified in
 * {@link PriceHistogram#getRequestedBucketCount()} or {@link AttributeHistogram#getRequestedBucketCount()} but there
 * may be less of them if there is no enough data for computation. Bucket thresholds are specified heuristically so that
 * there are as few "empty buckets" as possible.
 * - buckets are defined by their lower bounds (inclusive)
 * - the upper bound is the lower bound of the next bucket
 */
export class Histogram {
    readonly min: BigDecimal
    readonly max: BigDecimal
    readonly overallCount: number
    readonly buckets: List<HistogramBucket>

    constructor(overallCount: number,
                buckets: List<HistogramBucket>,
                min: BigDecimal,
                max: BigDecimal){
        this.min = min
        this.max = max
        this.overallCount = overallCount
        this.buckets = buckets
    }
}
