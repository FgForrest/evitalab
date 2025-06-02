import { BigDecimal } from "./BigDecimal";
import { PrettyPrintable } from "./PrettyPrintable";
import { Range } from "./Range";

/**
 * Specialized {@link Range} for {@link BigDecimal}.
 */
export class BigDecimalNumberRange extends Range<BigDecimal> {

    constructor(from: BigDecimal | undefined, to: BigDecimal | undefined){
        super(from, to)
    }

    protected assertValidity(from?: BigDecimal, to?: BigDecimal): void {
        super.assertValidity(from, to)
        if (from != undefined && to != undefined && from.toFloat() > to.toFloat()) {
            throw new Error(`Invalid range: from (${from.value}) cannot be greater than to (${to.value})`)
        }
    }

    getPrettyPrintableString(): string {
        return this.toString()
    }

    getRangeValues(): [BigDecimal | undefined, BigDecimal | undefined]{
        return [this.from, this.to]
    }

    override toString(): string {
        return `[${this.from?.value ?? '∞'},${this.to?.value?? '∞'}]`
    }
}
