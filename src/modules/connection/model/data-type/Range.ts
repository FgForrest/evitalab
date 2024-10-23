import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'

// todo docs
export abstract class Range<T> {
    protected from?: T
    protected to?: T

    constructor(from: T | undefined, to: T | undefined) {
        if (this.checkDateTimeValidity(from, to)) {
            this.from = from
            this.to = to
        }
    }

    private checkDateTimeValidity(from?: T, to?: T): boolean {
        if (from == undefined && to == undefined)
            throw new UnexpectedError(
                'Both props (from and to) in Range are undefined'
            )
        else return true
    }

    abstract getRangeValues():[T|undefined, T|undefined]

    abstract toString():string;
}
