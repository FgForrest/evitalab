import { DateTime } from 'luxon'
import type { PrettyPrintable } from "./PrettyPrintable"

/**
 * A time without a time-zone in the ISO-8601 calendar system, such as 10:15:30.
 */
export class LocalTime implements PrettyPrintable {
    readonly isoTime : string

    constructor(isoTime: string){
        this.isoTime = isoTime
    }
    /**
     * The value carries no date, which `new Date(...)` rejects outright; Luxon reads a bare ISO time
     * against the current day instead, and the date part is dropped by the format anyway.
     */
    getPrettyPrintableString(): string {
        return DateTime.fromISO(this.isoTime).toLocaleString({ timeStyle: 'medium' })
    }

    toString():string{
        return this.isoTime
    }
}
