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

test('Should serialize a date-time range with both ends set (UTC offsets)', () => {
    const range: DateTimeRange = DateTimeRange.between(
        offsetDateTime(summerInstant, 'Z'),
        offsetDateTime(winterInstant, 'Z')
    )
    expect(range.toString()).not.toContain('null')
    expect(range.toString())
        .toEqual('[2024-07-01T00:00:00.000Z,2025-01-01T00:00:00.000Z]')
})
