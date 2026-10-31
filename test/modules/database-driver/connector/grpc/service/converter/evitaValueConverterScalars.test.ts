import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { create } from '@bufbuild/protobuf'
import type { MessageInitShape } from '@bufbuild/protobuf'
import { DateTime, Settings } from 'luxon'
import { List as ImmutableList } from 'immutable'
import { EvitaValueConverter } from '@/modules/database-driver/connector/grpc/service/converter/EvitaValueConverter'
import { GrpcEvitaValueSchema } from '@/modules/database-driver/connector/grpc/gen/GrpcEvitaDataTypes_pb'
import { GrpcEvitaDataType } from '@/modules/database-driver/connector/grpc/gen/GrpcEnums_pb'
import { IntegerRange } from '@/modules/database-driver/data-type/IntegerRange'
import { BigintNumberRange } from '@/modules/database-driver/data-type/BigintNumberRange'
import { LocalDate } from '@/modules/database-driver/data-type/LocalDate'
import { LocalDateTime } from '@/modules/database-driver/data-type/LocalDateTime'
import { LocalTime } from '@/modules/database-driver/data-type/LocalTime'

type GrpcEvitaValueInit = MessageInitShape<typeof GrpcEvitaValueSchema>

function convert(init: GrpcEvitaValueInit): unknown {
    const value = create(GrpcEvitaValueSchema, init)
    return EvitaValueConverter.convertGrpcValue(value, value.value.case)
}

/**
 * evitaDB encodes zone-less values as an instant in the UTC offset (`EvitaDataTypesConverter.DEFAULT_ZONE_OFFSET`).
 */
function utcTimestamp(dateTime: DateTime): { timestamp: { seconds: bigint, nanos: number }, offset: string } {
    const millis: number = dateTime.toMillis()
    const seconds: number = Math.floor(millis / 1000)
    return {
        timestamp: { seconds: BigInt(seconds), nanos: (millis - seconds * 1000) * 1_000_000 },
        offset: 'Z'
    }
}

describe('EvitaValueConverter.convertGrpcValue', () => {
    test('Should convert a single long into a bigint like long arrays and ranges', () => {
        expect(convert({
            type: GrpcEvitaDataType.LONG,
            value: { case: 'longValue', value: '9007199254740993' }
        })).toBe(9007199254740993n)
    })

    test('Should convert a short number range into a range', () => {
        expect(convert({
            type: GrpcEvitaDataType.SHORT_NUMBER_RANGE,
            value: { case: 'integerNumberRangeValue', value: { from: 1, to: 5 } }
        })).toEqual(new IntegerRange(1, 5))
    })

    test('Should convert a short array into a list of numbers', () => {
        const converted: unknown = convert({
            type: GrpcEvitaDataType.SHORT_ARRAY,
            value: { case: 'integerArrayValue', value: { value: [1, 2] } }
        })
        expect(ImmutableList.isList(converted)).toBe(true)
        expect((converted as ImmutableList<number>).toArray()).toEqual([1, 2])
    })

    test('Should convert single number ranges with one or both ends set', () => {
        expect(convert({
            type: GrpcEvitaDataType.INTEGER_NUMBER_RANGE,
            value: { case: 'integerNumberRangeValue', value: { from: 1, to: 5 } }
        })).toEqual(new IntegerRange(1, 5))
        expect(convert({
            type: GrpcEvitaDataType.BYTE_NUMBER_RANGE,
            value: { case: 'integerNumberRangeValue', value: { from: 0 } }
        })).toEqual(new IntegerRange(0, undefined))
        expect(convert({
            type: GrpcEvitaDataType.LONG_NUMBER_RANGE,
            value: { case: 'longNumberRangeValue', value: { to: 7n } }
        })).toEqual(new BigintNumberRange(undefined, 7n))
    })

    test('Should convert a character array, which evitaDB encodes as a string array, into a list of strings', () => {
        const converted: unknown = convert({
            type: GrpcEvitaDataType.CHARACTER_ARRAY,
            value: { case: 'stringArrayValue', value: { value: ['a', 'b'] } }
        })
        expect(ImmutableList.isList(converted)).toBe(true)
        expect((converted as ImmutableList<string>).toArray()).toEqual(['a', 'b'])
    })
})

describe('EvitaValueConverter zone-less date-time values', () => {
    let originalDefaultZone: typeof Settings.defaultZone

    beforeEach(() => {
        originalDefaultZone = Settings.defaultZone
        // a viewer behind UTC, where reading the UTC instant in the viewer's zone shifts the day back
        Settings.defaultZone = 'UTC-3'
    })

    afterEach(() => {
        Settings.defaultZone = originalDefaultZone
    })

    test('Should read a local date time in the offset it was sent in', () => {
        const converted: unknown = convert({
            type: GrpcEvitaDataType.LOCAL_DATE_TIME,
            value: {
                case: 'offsetDateTimeValue',
                value: utcTimestamp(DateTime.fromISO('2026-08-26T10:15:30.120', { zone: 'utc' }))
            }
        })
        expect(converted).toEqual(new LocalDateTime('2026-08-26T10:15:30.12'))
    })

    test('Should omit a zero second fraction of a local date time', () => {
        const converted: unknown = convert({
            type: GrpcEvitaDataType.LOCAL_DATE_TIME,
            value: {
                case: 'offsetDateTimeValue',
                value: utcTimestamp(DateTime.fromISO('2026-08-26T00:00:00', { zone: 'utc' }))
            }
        })
        expect(converted).toEqual(new LocalDateTime('2026-08-26T00:00:00'))
    })

    test('Should read a local date in the offset it was sent in', () => {
        const converted: unknown = convert({
            type: GrpcEvitaDataType.LOCAL_DATE,
            value: {
                case: 'offsetDateTimeValue',
                value: utcTimestamp(DateTime.fromISO('2026-08-26T00:00:00', { zone: 'utc' }))
            }
        })
        expect(converted).toEqual(new LocalDate('2026-08-26'))
    })

    test('Should read a local time, which evitaDB sends on the first day of year 0, in the offset it was sent in', () => {
        const converted: unknown = convert({
            type: GrpcEvitaDataType.LOCAL_TIME,
            value: {
                case: 'offsetDateTimeValue',
                value: utcTimestamp(DateTime.fromObject(
                    { year: 0, month: 1, day: 1, hour: 10, minute: 15, second: 0, millisecond: 500 },
                    { zone: 'utc' }
                ))
            }
        })
        expect(converted).toEqual(new LocalTime('10:15:00.5'))
    })

    test('Should read arrays of zone-less values in the offset they were sent in', () => {
        const midnight = utcTimestamp(DateTime.fromISO('2026-08-26T00:00:00', { zone: 'utc' }))
        const dateTimes: unknown = convert({
            type: GrpcEvitaDataType.LOCAL_DATE_TIME_ARRAY,
            value: { case: 'offsetDateTimeArrayValue', value: { value: [midnight] } }
        })
        const dates: unknown = convert({
            type: GrpcEvitaDataType.LOCAL_DATE_ARRAY,
            value: { case: 'offsetDateTimeArrayValue', value: { value: [midnight] } }
        })
        const times: unknown = convert({
            type: GrpcEvitaDataType.LOCAL_TIME_ARRAY,
            value: { case: 'offsetDateTimeArrayValue', value: { value: [midnight] } }
        })
        expect((dateTimes as ImmutableList<LocalDateTime>).toArray()).toEqual([new LocalDateTime('2026-08-26T00:00:00')])
        expect((dates as ImmutableList<LocalDate>).toArray()).toEqual([new LocalDate('2026-08-26')])
        expect((times as ImmutableList<LocalTime>).toArray()).toEqual([new LocalTime('00:00:00')])
    })
})
