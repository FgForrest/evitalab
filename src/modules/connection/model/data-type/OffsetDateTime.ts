import { DateTime } from 'luxon'
import { PrettyPrintable } from './PrettyPrintable'
import { timeOffsetFrom } from '@/utils/dateTime'

const offsetDateTimeFormatter = new Intl.DateTimeFormat([], {
    dateStyle: 'short',
    timeStyle: 'long',
})

//TODO add doc

// todo lho minutes are wrong
export class OffsetDateTime implements PrettyPrintable {
    readonly timestamp: Timestamp
    readonly offset: string

    // todo lho refactor usages to single convert method?
    constructor(timestamp: Timestamp, offset: string) {
        this.timestamp = timestamp
        this.offset = offset
    }

    static fromDateTime(dateTime: DateTime): OffsetDateTime {
        const timestamp: Timestamp = Timestamp.fromDate(dateTime.toJSDate())
        const offset: string = timeOffsetFrom(dateTime)
        return new OffsetDateTime(timestamp, offset)
    }

    getPrettyPrintableString(): string {
        // todo lho verify this, i think the final date should contain the offset as well
        return `${offsetDateTimeFormatter.format(this.timestamp?.toDate())}`
    }
    static ofInstant(instant: bigint, offset: string): OffsetDateTime {
        const timestamp = new Timestamp(instant, 0)
        return new OffsetDateTime(timestamp, offset)
    }

    toDateTime(): DateTime {
        const dateTime: DateTime = DateTime.fromSeconds(Number(this.timestamp.seconds))
        return dateTime.setZone(this.offset)
    }

    toString(): string {
        return DateTime.fromSeconds(Number(this.timestamp?.seconds), {zone: this.offset }).toISO({includeOffset: true})
    }
}

export class Timestamp {
    /**
     * Represents seconds of UTC time since Unix epoch
     * 1970-01-01T00:00:00Z. Must be from 0001-01-01T00:00:00Z to
     * 9999-12-31T23:59:59Z inclusive.
     */
    seconds: bigint;
    /**
     * Non-negative fractions of a second at nanosecond resolution. Negative
     * second values with fractions must still have non-negative nanos values
     * that count forward in time. Must be from 0 to 999,999,999
     * inclusive.
     */
    nanos: number;

    constructor(seconds: bigint, nanos: number) {
        this.seconds = seconds;
        this.nanos = nanos
    }

    static fromDate(date: Date): Timestamp {
        const seconds: number = Math.floor(date.getTime() / 1000)
        const nanos: number = (date.getTime() - (seconds * 1000)) * 1000
        return new Timestamp(BigInt(seconds), nanos)
    }

    toDate(): Date {
        return new Date((Number(this.seconds) * 1000) + Math.round(this.nanos / 1000000))
    }
}
