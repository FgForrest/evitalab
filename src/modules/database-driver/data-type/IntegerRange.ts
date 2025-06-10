import type { PrettyPrintable } from "./PrettyPrintable";
import { Range } from "./Range";

/**
 * Specialized {@link Range} for integer.
 */
export class IntegerRange extends Range<number> implements PrettyPrintable {

    constructor(from?: number, to?: number){
        super(from, to);
    }

    protected assertValidity(from?: number, to?: number): void {
        super.assertValidity(from, to)
        if (from != undefined && to != undefined && from > to) {
            throw new Error(`Invalid range: from (${from}) cannot be greater than to (${to})`);
        }
    }

    getPrettyPrintableString(): string {
        return this.toString()
    }

    getRangeValues():[number | undefined, number | undefined]{
        return [this.from, this.to]
    }

    override toString(): string {
        return `${this.from ?? '∞'},${this.to ?? '∞'}`
    }
}
