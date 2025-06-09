import type { PrettyPrintable } from "./PrettyPrintable"

/**
 * A date-time without a time-zone in the ISO-8601 calendar system, such as 2007-12-03T10:15:30.
 */
export class LocalDateTime implements PrettyPrintable {
    readonly isoDate: string
    constructor(isoDate: string) {
        this.isoDate = isoDate
    }

    getPrettyPrintableString(): string {
        const localDateTimeFormatter = new Intl.DateTimeFormat([], {
            dateStyle: 'medium',
            timeStyle: 'medium',
        })
        return localDateTimeFormatter.format(new Date(this.isoDate))
    }

    toString():string{
        return this.isoDate
    }
}
