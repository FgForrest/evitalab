import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { Settings } from 'luxon'
import { List as ImmutableList } from 'immutable'
import { Scalar } from '@/modules/database-driver/data-type/Scalar'
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
 * The entity grid prints a column by its scalar, the cell detail prints the same value by its runtime type; both
 * must produce the same text.
 */

// 2024-07-01T00:00:00Z
const summerInstant: bigint = 1719792000n
const offsetDateTime: OffsetDateTime = OffsetDateTime.of(summerInstant, 0, '+02:00')
const uuid: Uuid = Uuid.fromCode('123e4567-e89b-12d3-a456-426614174000')

/**
 * One model value per scalar, as the query executors store it; a new scalar does not compile until it gets a sample.
 */
const samples: Readonly<Record<Scalar, unknown>> = {
    [Scalar.String]: 'code',
    [Scalar.StringArray]: ImmutableList(['a', 'b']),
    [Scalar.Byte]: 1,
    [Scalar.ByteArray]: ImmutableList([1, 2]),
    [Scalar.Short]: 300,
    [Scalar.ShortArray]: ImmutableList([300]),
    [Scalar.Integer]: 1000000,
    [Scalar.IntegerArray]: ImmutableList([1000000]),
    [Scalar.Long]: 9007199254740993n,
    [Scalar.LongArray]: ImmutableList([1n, 2n]),
    [Scalar.Boolean]: true,
    [Scalar.BooleanArray]: ImmutableList([true, false]),
    [Scalar.Character]: 'c',
    [Scalar.CharacterArray]: ImmutableList(['c']),
    [Scalar.BigDecimal]: new BigDecimal('10.50'),
    [Scalar.BigDecimalArray]: ImmutableList([new BigDecimal('1.5')]),
    [Scalar.OffsetDateTime]: offsetDateTime,
    [Scalar.OffsetDateTimeArray]: ImmutableList([offsetDateTime]),
    [Scalar.LocalDateTime]: new LocalDateTime('2024-07-01T10:15:30'),
    [Scalar.LocalDateTimeArray]: ImmutableList([new LocalDateTime('2024-07-01T10:15:30')]),
    [Scalar.LocalDate]: new LocalDate('2024-07-01'),
    [Scalar.LocalDateArray]: ImmutableList([new LocalDate('2024-07-01')]),
    [Scalar.LocalTime]: new LocalTime('10:15:30'),
    [Scalar.LocalTimeArray]: ImmutableList([new LocalTime('10:15:30')]),
    [Scalar.DateTimeRange]: DateTimeRange.since(offsetDateTime),
    [Scalar.DateTimeRangeArray]: ImmutableList([DateTimeRange.until(offsetDateTime)]),
    [Scalar.BigDecimalNumberRange]: new BigDecimalNumberRange(new BigDecimal('1.5'), undefined),
    [Scalar.BigDecimalNumberRangeArray]: ImmutableList([new BigDecimalNumberRange(new BigDecimal('1'), new BigDecimal('2'))]),
    [Scalar.ByteNumberRange]: new IntegerRange(0, 5),
    [Scalar.ByteNumberRangeArray]: ImmutableList([new IntegerRange(0, 5)]),
    [Scalar.ShortNumberRange]: new IntegerRange(undefined, 5),
    [Scalar.ShortNumberRangeArray]: ImmutableList([new IntegerRange(1, undefined)]),
    [Scalar.IntegerNumberRange]: new IntegerRange(1, 5),
    [Scalar.IntegerNumberRangeArray]: ImmutableList([new IntegerRange(1, 5)]),
    [Scalar.LongNumberRange]: new BigintNumberRange(1n, 9007199254740993n),
    [Scalar.LongNumberRangeArray]: ImmutableList([new BigintNumberRange(1n, undefined)]),
    [Scalar.Locale]: new Locale('cs-CZ'),
    [Scalar.LocaleArray]: ImmutableList([new Locale('cs-CZ'), new Locale('en')]),
    [Scalar.Currency]: new Currency('EUR'),
    [Scalar.CurrencyArray]: ImmutableList([new Currency('EUR')]),
    [Scalar.UUID]: uuid,
    [Scalar.UUIDArray]: ImmutableList([uuid]),
    [Scalar.Predecessor]: new Predecessor(true, -1),
    [Scalar.ReferencedEntityPredecessor]: new Predecessor(false, 5),
    // complex data holding a plain array is JSON both ways
    [Scalar.ComplexDataObject]: [{ name: 'x', count: 2n }, 'y']
}

describe('EvitaValuePrinter scalar and runtime dispatch', () => {
    let originalDefaultLocale: string

    beforeEach(() => {
        originalDefaultLocale = Settings.defaultLocale
        Settings.defaultLocale = 'en-US'
    })

    afterEach(() => {
        Settings.defaultLocale = originalDefaultLocale
    })

    test.each(Object.entries(samples))('Should print a %s value by its scalar as by its runtime type', (scalar, value) => {
        const byScalar: string = evitaValuePrinter.print(value, scalar as Scalar)

        expect(byScalar).toBe(evitaValuePrinter.print(value))
        expect(byScalar).not.toBe('')
    })

    test('Should print complex data holding a plain array as JSON', () => {
        expect(evitaValuePrinter.print(samples[Scalar.ComplexDataObject], Scalar.ComplexDataObject))
            .toBe('[{"name":"x","count":"2"},"y"]')
    })
})
