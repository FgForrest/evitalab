import { BigDecimal } from "../data-type/BigDecimal";
import { Value } from "../Value";

//TODO: Add documentation
export class HistogramBucket {
    readonly threshold: Value<BigDecimal>
    readonly occurrences: Value<number>
    readonly requested: Value<boolean>

    constructor(occurrences: Value<number>, requested: Value<boolean>, threshold: Value<BigDecimal>){
        this.threshold = threshold
        this.occurrences = occurrences
        this.requested = requested
    }
}
