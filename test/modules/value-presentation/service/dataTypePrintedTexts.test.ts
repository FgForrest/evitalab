import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { Settings } from 'luxon'
import { BigDecimal } from '@/modules/database-driver/data-type/BigDecimal'
import { BigDecimalNumberRange } from '@/modules/database-driver/data-type/BigDecimalNumberRange'
import { BigintNumberRange } from '@/modules/database-driver/data-type/BigintNumberRange'
import { Currency } from '@/modules/database-driver/data-type/Currency'
import { DateTimeRange } from '@/modules/database-driver/data-type/DateTimeRange'
import { IntegerRange } from '@/modules/database-driver/data-type/IntegerRange'
import { LocalDate } from '@/modules/database-driver/data-type/LocalDate'
import { LocalDateTime } from '@/modules/database-driver/data-type/LocalDateTime'
import { LocalTime } from '@/modules/database-driver/data-type/LocalTime'
import { Locale } from '@/modules/database-driver/data-type/Locale'
import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime'
import { Predecessor } from '@/modules/database-driver/data-type/Predecessor'
import { Uuid } from '@/modules/database-driver/data-type/Uuid'
import { EvitaValuePrinter } from '@/modules/value-presentation/service/EvitaValuePrinter'

const evitaValuePrinter: EvitaValuePrinter = new EvitaValuePrinter()

/**
 * Pins the human-readable texts of the driver's data types, so that moving their formatting elsewhere changes no
 * visible text. Luxon formats in the en-US locale and a zone behind UTC, which a value printed in the viewer's zone
 * instead of its own offset would reveal.
 */

// 2024-07-01T00:00:00Z
const summerInstant: bigint = 1719792000n
// 2025-01-01T00:00:00Z
const winterInstant: bigint = 1735689600n
const uuidCode: string = '123e4567-e89b-12d3-a456-426614174000'

/**
 * `LocalDateTime` is formatted by `Intl` in the process locale and time zone, which a test cannot switch; its
 * expected text is built from the same wall-clock value constructed field by field.
 */
function intlMediumDateTime(year: number, monthIndex: number, day: number, hour: number, minute: number, second: number): string {
    return new Intl.DateTimeFormat([], { dateStyle: 'medium', timeStyle: 'medium' })
        .format(new Date(year, monthIndex, day, hour, minute, second))
}

/**
 * ICU versions differ in the space they put before the day period (a narrow no-break space in newer ones).
 */
function normalizeSpaces(text: string): string {
    return text.replace(/[  ]/g, ' ')
}

type PrintedTextCase = [description: string, value: () => unknown, expectedText: () => string]

const cases: PrintedTextCase[] = [
    ['BigDecimal', () => new BigDecimal('10.50'), () => '10.50'],
    ['Currency', () => new Currency('EUR'), () => 'EUR'],
    ['Locale', () => new Locale('cs-CZ'), () => 'cs-CZ'],
    ['Uuid', () => Uuid.fromCode(uuidCode), () => uuidCode],
    ['Predecessor head', () => new Predecessor(true, -1), () => 'Head'],
    ['Predecessor', () => new Predecessor(false, 5), () => '5'],
    ['OffsetDateTime in a positive offset', () => OffsetDateTime.of(summerInstant, 0, '+02:00'), () => '7/1/24, 2:00:00 AM GMT+2'],
    ['OffsetDateTime in UTC', () => OffsetDateTime.of(summerInstant, 500_000_000, 'Z'), () => '7/1/24, 12:00:00 AM UTC'],
    ['OffsetDateTime in a half-hour offset', () => OffsetDateTime.of(summerInstant, 0, '+05:30'), () => '7/1/24, 5:30:00 AM UTC+5:30'],
    [
        'DateTimeRange with both ends',
        () => DateTimeRange.between(OffsetDateTime.of(summerInstant, 0, 'Z'), OffsetDateTime.of(winterInstant, 0, '+02:00')),
        () => '[Jul 1, 2024, 12:00:00 AM UTC,Jan 1, 2025, 2:00:00 AM GMT+2]'
    ],
    ['DateTimeRange since', () => DateTimeRange.since(OffsetDateTime.of(summerInstant, 0, 'Z')), () => '[Jul 1, 2024, 12:00:00 AM UTC,∞]'],
    ['DateTimeRange until', () => DateTimeRange.until(OffsetDateTime.of(summerInstant, 0, '-05:00')), () => '[∞,Jun 30, 2024, 7:00:00 PM GMT-5]'],
    ['IntegerRange', () => new IntegerRange(1, 5), () => '1,5'],
    ['IntegerRange open', () => new IntegerRange(1, undefined), () => '1,∞'],
    ['BigintNumberRange', () => new BigintNumberRange(1n, 2n), () => '[1, 2]'],
    ['BigintNumberRange open', () => new BigintNumberRange(undefined, 2n), () => '[∞, 2]'],
    ['BigDecimalNumberRange', () => new BigDecimalNumberRange(new BigDecimal('1.5'), new BigDecimal('2')), () => '[1.5,2]'],
    ['BigDecimalNumberRange open', () => new BigDecimalNumberRange(new BigDecimal('1.5'), undefined), () => '[1.5,∞]'],
    ['LocalDate', () => new LocalDate('2026-08-26'), () => 'Aug 26, 2026'],
    ['LocalTime', () => new LocalTime('10:15:30'), () => '10:15:30 AM'],
    ['LocalTime with a fraction', () => new LocalTime('10:15:00.5'), () => '10:15:00 AM'],
    ['LocalDateTime', () => new LocalDateTime('2026-08-26T10:15:30'), () => intlMediumDateTime(2026, 7, 26, 10, 15, 30)],
    ['LocalDateTime with a fraction', () => new LocalDateTime('2026-08-26T10:15:30.12'), () => intlMediumDateTime(2026, 7, 26, 10, 15, 30)],
]

describe('Printed texts of data types', () => {
    let originalDefaultLocale: string
    let originalDefaultZone: typeof Settings.defaultZone

    beforeEach(() => {
        originalDefaultLocale = Settings.defaultLocale
        originalDefaultZone = Settings.defaultZone
        Settings.defaultLocale = 'en-US'
        Settings.defaultZone = 'UTC-3'
    })

    afterEach(() => {
        Settings.defaultLocale = originalDefaultLocale
        Settings.defaultZone = originalDefaultZone
    })

    test.each(cases)('Should print %s', (_, value, expectedText) => {
        expect(normalizeSpaces(evitaValuePrinter.print(value()))).toBe(normalizeSpaces(expectedText()))
    })
})
