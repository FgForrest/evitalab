import { test, expect } from 'vitest'
import { OffsetDateTime, Timestamp } from '../../../../src/modules/database-driver/data-type/OffsetDateTime'
import { DateTimeRange } from '../../../../src/modules/database-driver/data-type/DateTimeRange'

// 2024-07-01T00:00:00Z
const summerInstant: bigint = BigInt(1719792000)
// 2025-01-01T00:00:00Z
const winterInstant: bigint = BigInt(1735689600)

function offsetDateTime(instant: bigint, offset: string): OffsetDateTime {
    return new OffsetDateTime(new Timestamp(instant, 0), offset)
}

test('Should serialize an ISO "Z" (UTC) offset instead of producing null', () => {
    // Luxon does not accept bare ISO offsets (such as "Z") as zone specifiers; a
    // regression here previously yielded the literal string "null".
    expect(offsetDateTime(summerInstant, 'Z').toString())
        .toEqual('2024-07-01T00:00:00.000Z')
})

test('Should serialize numeric ISO offsets', () => {
    expect(offsetDateTime(summerInstant, '+02:00').toString())
        .toEqual('2024-07-01T02:00:00.000+02:00')
    expect(offsetDateTime(summerInstant, '-05:30').toString())
        .toEqual('2024-06-30T18:30:00.000-05:30')
})

test('Should keep sub-second precision when converting from a JS date', () => {
    // nanos used to be computed with a milliseconds-to-microseconds factor, which lost the fraction
    const date: Date = new Date(Date.UTC(2024, 6, 1, 0, 0, 0, 123))
    const timestamp: Timestamp = Timestamp.fromDate(date)

    expect(timestamp.seconds).toEqual(summerInstant)
    expect(timestamp.nanos).toEqual(123_000_000)
    expect(timestamp.toDate().getTime()).toEqual(date.getTime())
})

test('Should carry sub-second precision through conversions', () => {
    const value: OffsetDateTime = OffsetDateTime.of(summerInstant, 500_000_000, '+02:00')

    expect(value.toDateTime().millisecond).toEqual(500)
    expect(value.toString()).toEqual('2024-07-01T02:00:00.500+02:00')
})

test('Should pretty print in the stored time offset, not in the local time zone', () => {
    // the date/time part is locale-specific, the offset marker is what tells the zones apart
    expect(OffsetDateTime.of(summerInstant, 0, '+02:00').toDateTime().hour).toEqual(2)
    expect(OffsetDateTime.of(summerInstant, 0, '+02:00').getPrettyPrintableString())
        .toMatch(/(GMT|UTC)\+2/)

    expect(OffsetDateTime.of(summerInstant, 0, '+05:30').toDateTime().hour).toEqual(5)
    expect(OffsetDateTime.of(summerInstant, 0, '+05:30').getPrettyPrintableString())
        .toMatch(/(GMT|UTC)\+5:30/)

    expect(OffsetDateTime.of(summerInstant, 0, 'Z').toDateTime().hour).toEqual(0)
    expect(OffsetDateTime.of(summerInstant, 0, 'Z').getPrettyPrintableString())
        .toMatch(/(GMT|UTC)(?!\+)/)
})

test('Should pretty print a date-time range in the offsets of its ends', () => {
    const range: DateTimeRange = DateTimeRange.between(
        offsetDateTime(summerInstant, 'Z'),
        offsetDateTime(winterInstant, '+02:00')
    )

    const value: string = range.getPrettyPrintableString()
    expect(value).toMatch(/(GMT|UTC)\+2/)
    expect(value.split(',')[0]).toContain('Jul')
})

test('Should accept a range whose ends fall into the same second', () => {
    // the ends used to be compared with the sub-second part discarded
    expect(() => DateTimeRange.between(
        OffsetDateTime.of(summerInstant, 100_000_000, 'Z'),
        OffsetDateTime.of(summerInstant, 900_000_000, 'Z')
    )).not.toThrow()
})

test('Should serialize a date-time range with both ends set (UTC offsets)', () => {
    const range: DateTimeRange = DateTimeRange.between(
        offsetDateTime(summerInstant, 'Z'),
        offsetDateTime(winterInstant, 'Z')
    )
    expect(range.toString()).not.toContain('null')
    expect(range.toString())
        .toEqual('[2024-07-01T00:00:00.000Z,2025-01-01T00:00:00.000Z]')
})
