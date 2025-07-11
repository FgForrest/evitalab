import type { PrettyPrintable } from "./PrettyPrintable"

/**
 * A time without a time-zone in the ISO-8601 calendar system, such as 10:15:30.
 */
export class LocalTime implements PrettyPrintable {
    readonly isoTime : string

    constructor(isoTime: string){
        this.isoTime = isoTime
    }
    getPrettyPrintableString(): string {
        const localTimeFormatter = new Intl.DateTimeFormat([], { timeStyle: 'medium' })
        return localTimeFormatter.format(new Date(this.isoTime))
    }

    toString():string{
        return this.isoTime
    }
}
