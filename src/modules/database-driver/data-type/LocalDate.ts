import { DateTime } from 'luxon'
import type { PrettyPrintable } from "./PrettyPrintable";

/**
 * A date without a time-zone in the ISO-8601 calendar system, such as 2007-12-03.
 */
export class LocalDate implements PrettyPrintable {
    readonly isoDate: string;

    constructor(isoDate: string){
        this.isoDate = isoDate
    }
    /**
     * The value is parsed by Luxon rather than by `new Date(...)`, which reads a bare ISO date as UTC
     * midnight and would render the previous day for viewers behind Greenwich.
     */
    getPrettyPrintableString(): string {
        return DateTime.fromISO(this.isoDate).toLocaleString({ dateStyle: 'medium' })
    }

    toString():string{
        return this.isoDate;
    }
}
