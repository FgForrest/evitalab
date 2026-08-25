import { DateTime } from 'luxon'
import type { PrettyPrintable } from './PrettyPrintable'
import { timeOffsetFrom, toLuxonZone } from '@/utils/dateTime'

export { toLuxonZone }

const nanosInMillisecond: number = 1_000_000

/**
 * Format of the human-readable representation. The offset marker is deliberately part of the output,
 * because the value is rendered in its own offset, not in the viewer's time zone.
 */
const prettyPrintableFormat: Intl.DateTimeFormatOptions = {
    dateStyle: 'short',
    timeStyle: 'long',
}

/**
 * A date-time with an offset from UTC/Greenwich in the ISO-8601 calendar system, such as 2007-12-03T10:15:30+01:00.
 */
export class OffsetDateTime implements PrettyPrintable {
    readonly timestamp: Timestamp
    readonly offset: string

    constructor(timestamp: Timestamp, offset: string) {
        this.timestamp = timestamp
        this.offset = offset
    }

    /**
     * Creates an instance from the raw parts of the represented instant, as they are transferred by the server
     * and stored in serialized tab data.
     *
     * @param seconds seconds of UTC time since the Unix epoch
     * @param nanos non-negative fraction of a second at nanosecond resolution
     * @param offset ISO time offset (`Z`, `±HH:MM`) the value is expressed in
     */
    static of(seconds: bigint, nanos: number, offset: string): OffsetDateTime {
        return new OffsetDateTime(new Timestamp(seconds, nanos), offset)
    }

    /**
     * Creates an instance from a zoned date time, keeping its time offset.
     */
    static fromDateTime(dateTime: DateTime): OffsetDateTime {
        return new OffsetDateTime(Timestamp.fromDate(dateTime.toJSDate()), timeOffsetFrom(dateTime))
    }

    getPrettyPrintableString(): string {
        return this.toDateTime().toLocaleString(prettyPrintableFormat)
    }

    /**
     * Converts the value into a zoned date time expressed in its own time offset. Sub-millisecond precision
     * is lost, Luxon works with millisecond resolution.
     */
    toDateTime(): DateTime {
        return DateTime.fromMillis(this.timestamp.toMillis(), { zone: toLuxonZone(this.offset) })
    }

    toString(): string {
        return this.toDateTime().toISO({ includeOffset: true })!
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
        const milliseconds: number = date.getTime()
        const seconds: number = Math.floor(milliseconds / 1000)
        const nanos: number = (milliseconds - (seconds * 1000)) * nanosInMillisecond
        return new Timestamp(BigInt(seconds), nanos)
    }

    /**
     * The represented instant in milliseconds since the Unix epoch; the sub-millisecond part of {@link nanos}
     * is rounded to the nearest millisecond.
     */
    toMillis(): number {
        return (Number(this.seconds) * 1000) + Math.round(this.nanos / nanosInMillisecond)
    }

    toDate(): Date {
        return new Date(this.toMillis())
    }
}
