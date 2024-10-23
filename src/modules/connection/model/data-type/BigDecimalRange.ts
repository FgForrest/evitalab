import { BigDecimal } from "./BigDecimal";
import { PrettyPrintable } from "./PrettyPrintable";
import { Range } from "./Range";

//TODO: Add documentation
export class BigDecimalRange extends Range<BigDecimal> implements PrettyPrintable{
    constructor(from: BigDecimal | undefined, to: BigDecimal | undefined){
        super(from, to)
    }

    getPrettyPrintableString(): string {
        return this.toString()
    }

    getRangeValues():[BigDecimal | undefined, BigDecimal | undefined]{
        return [this.from, this.to]
    }

    override toString(): string {
        return `[${this.from?.value ?? '∞'},${this.to?.value?? '∞'}]`
    }
}
