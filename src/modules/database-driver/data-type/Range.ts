import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { PrettyPrintable } from '@/modules/database-driver/data-type/PrettyPrintable'

/**
 * Range type that envelopes {@link Number} types.
 */
export abstract class Range<T> implements PrettyPrintable {
    protected from?: T
    protected to?: T

    protected constructor(from: T | undefined, to: T | undefined) {
        this.assertValidity(from, to)
        this.from = from
        this.to = to
    }

    protected assertValidity(from?: T, to?: T): void {
        if (from == undefined && to == undefined) {
            throw new UnexpectedError('Both props (from and to) in Range are undefined')
        }
    }

    abstract getRangeValues(): [T|undefined, T|undefined]

    abstract getPrettyPrintableString(): string;

    abstract toString(): string;
}
