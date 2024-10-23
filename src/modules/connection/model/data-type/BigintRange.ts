import { Range } from "./Range";
import { PrettyPrintable } from "./PrettyPrintable";

//TODO: Add documentation
export class BigintRange extends Range<bigint> implements PrettyPrintable {
    
    constructor(from?: bigint, to?: bigint){
        super(from, to)
    }
    getPrettyPrintableString(): string {
        return this.toString()
    }

    getRangeValues():[bigint | undefined, bigint | undefined]{
        return [this.from, this.to]
    }

    override toString(): string {
        return `[${this.from ?? '∞'}, ${this.to ?? '∞'}]`
    }
}