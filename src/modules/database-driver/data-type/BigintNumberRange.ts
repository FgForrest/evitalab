import { Range } from "./Range";
import type { PrettyPrintable } from "./PrettyPrintable";

/**
 * Specialized {@link Range} for {@link bigint}.
 */
export class BigintNumberRange extends Range<bigint> {

    constructor(from?: bigint, to?: bigint){
        super(from, to)
    }

    protected assertValidity(from?: bigint, to?: bigint): void {
        super.assertValidity(from, to)
        if (from != undefined && to != undefined && from > to) {
            throw new Error(`Invalid range: from (${from}) cannot be greater than to (${to})`);
        }
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
