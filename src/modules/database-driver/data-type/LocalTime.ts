/**
 * A time without a time-zone in the ISO-8601 calendar system, such as 10:15:30.
 */
export class LocalTime {
    readonly isoTime : string

    constructor(isoTime: string){
        this.isoTime = isoTime
    }

    toString():string{
        return this.isoTime
    }
}
