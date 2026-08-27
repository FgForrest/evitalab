import { test, expect } from 'vitest'
import { DateTime } from 'luxon'
import { parseDateTimeInput, timeOffsetFrom, toLuxonZone } from '../../src/utils/dateTime'
import type { ParsedDateTimeInput } from '../../src/utils/dateTime'

function expectWallClock(
    parsed: ParsedDateTimeInput | undefined,
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    second: number
): void {
    expect(parsed).toBeDefined()
    expect(parsed!.dateTime.year).toBe(year)
    expect(parsed!.dateTime.month).toBe(month)
    expect(parsed!.dateTime.day).toBe(day)
    expect(parsed!.dateTime.hour).toBe(hour)
    expect(parsed!.dateTime.minute).toBe(minute)
    expect(parsed!.dateTime.second).toBe(second)
}

test('Should extract time offset from date time', () => {
    expect(timeOffsetFrom(DateTime.fromISO('2025-05-25T14:30:00+02:00', { setZone: true }))).toBe('+02:00')
    expect(timeOffsetFrom(DateTime.fromISO('2025-05-25T14:30:00Z', { setZone: true }))).toBe('+00:00')
})

test('Should convert ISO offset to Luxon zone', () => {
    expect(toLuxonZone('Z')).toBe('UTC')
    expect(toLuxonZone('')).toBe('UTC')
    expect(toLuxonZone('+02:00')).toBe('UTC+02:00')
    expect(toLuxonZone('-05:30')).toBe('UTC-05:30')
})

test('Should parse ISO date time with explicit offset', () => {
    const parsed = parseDateTimeInput('2025-05-25T14:30:00+02:00')
    expectWallClock(parsed, 2025, 5, 25, 14, 30, 0)
    expect(parsed!.explicitOffset).toBe('+02:00')

    const parsedUtc = parseDateTimeInput('2025-05-25T14:30:00Z')
    expectWallClock(parsedUtc, 2025, 5, 25, 14, 30, 0)
    expect(parsedUtc!.explicitOffset).toBe('+00:00')
})

test('Should parse ISO date time without offset as wall clock only', () => {
    const parsed = parseDateTimeInput('2025-05-25T14:30:00')
    expectWallClock(parsed, 2025, 5, 25, 14, 30, 0)
    expect(parsed!.explicitOffset).toBeUndefined()

    const withoutSeconds = parseDateTimeInput('2025-05-25T14:30')
    expectWallClock(withoutSeconds, 2025, 5, 25, 14, 30, 0)
    expect(withoutSeconds!.explicitOffset).toBeUndefined()
})

test('Should parse ISO date time with milliseconds', () => {
    const parsed = parseDateTimeInput('2025-05-25T14:30:00.123+02:00')
    expectWallClock(parsed, 2025, 5, 25, 14, 30, 0)
    expect(parsed!.explicitOffset).toBe('+02:00')
})

test('Should parse bare ISO date without treating date separators as offset', () => {
    const parsed = parseDateTimeInput('2025-05-25')
    expectWallClock(parsed, 2025, 5, 25, 0, 0, 0)
    expect(parsed!.explicitOffset).toBeUndefined()
})

test('Should parse SQL-like date time', () => {
    const parsed = parseDateTimeInput('2025-05-25 14:30:00')
    expectWallClock(parsed, 2025, 5, 25, 14, 30, 0)
    expect(parsed!.explicitOffset).toBeUndefined()
})

test('Should parse RFC 2822 date time', () => {
    const parsed = parseDateTimeInput('Sun, 25 May 2025 14:30:00 +0200')
    expectWallClock(parsed, 2025, 5, 25, 14, 30, 0)
    expect(parsed!.explicitOffset).toBe('+02:00')
})

test('Should parse pretty-printed en-US date time with GMT offset', () => {
    // this is what OffsetDateTime.getPrettyPrintableString() renders in the UI
    const parsed = parseDateTimeInput('5/25/25, 2:30:00 PM GMT+2', 'en-US')
    expectWallClock(parsed, 2025, 5, 25, 14, 30, 0)
    expect(parsed!.explicitOffset).toBe('+02:00')
})

test('Should parse pretty-printed en-US date time with narrow no-break space and UTC zone', () => {
    const parsed = parseDateTimeInput('5/25/25, 2:30:00 PM UTC', 'en-US')
    expectWallClock(parsed, 2025, 5, 25, 14, 30, 0)
    expect(parsed!.explicitOffset).toBe('+00:00')
})

test('Should parse full en-US date time as displayed by the input itself', () => {
    // DateTime.DATETIME_FULL_WITH_SECONDS rendering without the zone name
    const parsed = parseDateTimeInput('May 25, 2025 at 2:30:00 PM GMT+2', 'en-US')
    expectWallClock(parsed, 2025, 5, 25, 14, 30, 0)
    expect(parsed!.explicitOffset).toBe('+02:00')
})

test('Should parse locale date time formats', () => {
    const enGb = parseDateTimeInput('25/05/2025, 14:30:00', 'en-GB')
    expectWallClock(enGb, 2025, 5, 25, 14, 30, 0)
    expect(enGb!.explicitOffset).toBeUndefined()

    const cs = parseDateTimeInput('25. 5. 2025 14:30:00', 'cs')
    expectWallClock(cs, 2025, 5, 25, 14, 30, 0)
    expect(cs!.explicitOffset).toBeUndefined()
})

test('Should parse GMT offset with minutes', () => {
    const parsed = parseDateTimeInput('2025-05-25T14:30:00 GMT+05:30')
    expectWallClock(parsed, 2025, 5, 25, 14, 30, 0)
    expect(parsed!.explicitOffset).toBe('+05:30')
})

test('Should not parse invalid input', () => {
    expect(parseDateTimeInput('')).toBeUndefined()
    expect(parseDateTimeInput('   ')).toBeUndefined()
    expect(parseDateTimeInput('hello there')).toBeUndefined()
    expect(parseDateTimeInput('UTC')).toBeUndefined()
    expect(parseDateTimeInput('2025-13-45T99:99:99')).toBeUndefined()
})
