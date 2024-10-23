import { BigDecimal } from "../data-type/BigDecimal";
import { Value } from "../Value";
import { HistogramBucket } from "./HistogramBucket";
import { List } from "immutable";

//TODO: Add documentation
export class Histogram {
    readonly min: Value<BigDecimal>
    readonly max: Value<BigDecimal>
    readonly overallCount: Value<number>
    readonly buckets: Value<List<HistogramBucket>>

    constructor(overallCount: Value<number>, buckets: Value<List<HistogramBucket>>, min: Value<BigDecimal>, max: Value<BigDecimal>){
        this.min = min
        this.max = max
        this.overallCount = overallCount
        this.buckets = buckets
    }
}
