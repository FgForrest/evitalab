/**
 * A date-time without a time-zone in the ISO-8601 calendar system, such as 2007-12-03T10:15:30.
 */
export class LocalDateTime {
    readonly isoDate: string
    constructor(isoDate: string) {
        this.isoDate = isoDate
    }

    toString():string{
        return this.isoDate
    }
}
