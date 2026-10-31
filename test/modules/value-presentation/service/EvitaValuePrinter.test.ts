import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { List as ImmutableList } from 'immutable'
import { Settings } from 'luxon'
import { Scalar } from '@/modules/database-driver/data-type/Scalar'
import { BigDecimal } from '@/modules/database-driver/data-type/BigDecimal'
import { DateTimeRange } from '@/modules/database-driver/data-type/DateTimeRange'
import { IntegerRange } from '@/modules/database-driver/data-type/IntegerRange'
import { Locale } from '@/modules/database-driver/data-type/Locale'
import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime'
import { Predecessor } from '@/modules/database-driver/data-type/Predecessor'
import { Range } from '@/modules/database-driver/data-type/Range'
import { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope'
import { PriceInnerRecordHandling } from '@/modules/database-driver/data-type/PriceInnerRecordHandling'
import { EvitaValuePrinter } from '@/modules/value-presentation/service/EvitaValuePrinter'
import {
    defaultDataTypeValuePrinters,
    defaultScalarValuePrinters
} from '@/modules/value-presentation/service/scalarValuePrinters'
import type { ValuePrinter } from '@/modules/value-presentation/service/ValuePrinter'

const evitaValuePrinter: EvitaValuePrinter = new EvitaValuePrinter()

// 2024-07-01T00:00:00Z
const summerInstant: bigint = 1719792000n

describe('EvitaValuePrinter', () => {
    let originalDefaultLocale: string

    beforeEach(() => {
        originalDefaultLocale = Settings.defaultLocale
        Settings.defaultLocale = 'en-US'
    })

    afterEach(() => {
        Settings.defaultLocale = originalDefaultLocale
    })

    test('Should print a missing value as an empty string', () => {
        expect(evitaValuePrinter.print(undefined)).toBe('')
        expect(evitaValuePrinter.print(null)).toBe('')
        expect(evitaValuePrinter.print(null, Scalar.OffsetDateTime)).toBe('')
    })

    test('Should print primitives by their string form without localizing numbers', () => {
        expect(evitaValuePrinter.print('text')).toBe('text')
        expect(evitaValuePrinter.print(1234567)).toBe('1234567')
        expect(evitaValuePrinter.print(9007199254740993n)).toBe('9007199254740993')
        expect(evitaValuePrinter.print(false)).toBe('false')
        expect(evitaValuePrinter.print(1234567, Scalar.Integer)).toBe('1234567')
        expect(evitaValuePrinter.print(9007199254740993n, Scalar.Long)).toBe('9007199254740993')
    })

    test('Should print an immutable list item by item', () => {
        expect(evitaValuePrinter.print(ImmutableList([new Locale('cs'), new Locale('en')]))).toBe('[cs, en]')
        expect(evitaValuePrinter.print(ImmutableList([1n, 2n]))).toBe('[1, 2]')
        expect(evitaValuePrinter.print(ImmutableList([new IntegerRange(1, 2)]))).toBe('[1,2]')
        expect(evitaValuePrinter.print(ImmutableList())).toBe('[]')
    })

    test('Should print a plain array and a plain object as JSON, bigint-safe', () => {
        expect(evitaValuePrinter.print([1, 'a'])).toBe('[1,"a"]')
        expect(evitaValuePrinter.print([new BigDecimal('1.5')])).toBe('[{"value":"1.5"}]')
        expect(evitaValuePrinter.print({ id: 5n, name: 'a' })).toBe('{"id":"5","name":"a"}')
    })

    test('Should let the scalar decide how a plain array prints', () => {
        expect(evitaValuePrinter.print([1, 2], Scalar.IntegerArray)).toBe('[1, 2]')
        expect(evitaValuePrinter.print([1, 2], Scalar.ComplexDataObject)).toBe('[1,2]')
        expect(evitaValuePrinter.print(ImmutableList([1, 2]), Scalar.IntegerArray)).toBe('[1, 2]')
    })

    test('Should print missing array items as empty strings', () => {
        expect(evitaValuePrinter.print([1, null, 3], Scalar.IntegerArray)).toBe('[1, , 3]')
    })

    test('Should print a predecessor and a referenced entity predecessor alike', () => {
        expect(evitaValuePrinter.print(new Predecessor(true, -1), Scalar.Predecessor)).toBe('Head')
        expect(evitaValuePrinter.print(new Predecessor(false, 5), Scalar.ReferencedEntityPredecessor)).toBe('5')
    })

    test('Should print the same text by scalar and by runtime type', () => {
        const offsetDateTime: OffsetDateTime = OffsetDateTime.of(summerInstant, 0, '+02:00')
        const range: DateTimeRange = DateTimeRange.since(offsetDateTime)

        expect(evitaValuePrinter.print(offsetDateTime, Scalar.OffsetDateTime)).toBe(evitaValuePrinter.print(offsetDateTime))
        expect(evitaValuePrinter.print(range, Scalar.DateTimeRange)).toBe(evitaValuePrinter.print(range))
        expect(evitaValuePrinter.print(new IntegerRange(1, 2), Scalar.ShortNumberRange)).toBe('1,2')
        expect(evitaValuePrinter.print(ImmutableList([offsetDateTime]), Scalar.OffsetDateTimeArray))
            .toBe(evitaValuePrinter.print(ImmutableList([offsetDateTime])))
    })

    test('Should use the printers it is given', () => {
        const upperCase: ValuePrinter<string> = { print: value => value.toUpperCase() }
        const printer: EvitaValuePrinter = new EvitaValuePrinter(
            { ...defaultScalarValuePrinters, [Scalar.String]: upperCase },
            [[BigDecimal, { print: () => 'decimal' }]]
        )

        expect(printer.print('text', Scalar.String)).toBe('TEXT')
        expect(printer.print(new BigDecimal('1'))).toBe('decimal')
        expect(printer.print(new Locale('cs'))).toBe('cs')
    })
})

describe('defaultDataTypeValuePrinters', () => {
    test('Should list DateTimeRange before Range, so that the first match is the subclass', () => {
        const classes: unknown[] = defaultDataTypeValuePrinters.map(([dataTypeClass]) => dataTypeClass)

        expect(classes.indexOf(DateTimeRange)).toBeGreaterThanOrEqual(0)
        expect(classes.indexOf(DateTimeRange)).toBeLessThan(classes.indexOf(Range))
    })

    test('Should list every subclass before its base class', () => {
        defaultDataTypeValuePrinters.forEach(([subclass], subclassIndex) => {
            defaultDataTypeValuePrinters.forEach(([baseClass], baseClassIndex) => {
                if (subclass !== baseClass && Object.prototype.isPrototypeOf.call(baseClass.prototype, subclass.prototype)) {
                    expect(subclassIndex).toBeLessThan(baseClassIndex)
                }
            })
        })
    })

    test('Should print a date-time range with its own range format', () => {
        const range: DateTimeRange = DateTimeRange.since(OffsetDateTime.of(summerInstant, 0, 'Z'))

        const dateTimeRangeValuePrinter: ValuePrinter<DateTimeRange> = defaultDataTypeValuePrinters
            .find(([dataTypeClass]) => dataTypeClass === DateTimeRange)![1]

        expect(evitaValuePrinter.print(range)).toBe(dateTimeRangeValuePrinter.print(range))
        expect(evitaValuePrinter.print(range)).not.toBe(range.toString())
    })
})

describe('Enum printing', () => {
    const printer: EvitaValuePrinter = new EvitaValuePrinter()

    test('Should print entity scopes translated', () => {
        expect(printer.printEntityScope(EntityScope.Live)).toBe('Live')
        expect(printer.printEntityScope(EntityScope.Archive)).toBe('Archived')
    })

    test('Should print price inner record handlings translated', () => {
        expect(printer.printPriceInnerRecordHandling(PriceInnerRecordHandling.None)).toBe('None')
        expect(printer.printPriceInnerRecordHandling(PriceInnerRecordHandling.LowestPrice)).toBe('Lowest price')
        expect(printer.printPriceInnerRecordHandling(PriceInnerRecordHandling.Sum)).toBe('Sum')
        expect(printer.printPriceInnerRecordHandling(PriceInnerRecordHandling.Unknown)).toBe('Unknown')
    })

    test('Should print an unknown enum value by its string form', () => {
        expect(printer.printEntityScope('deleted' as EntityScope)).toBe('deleted')
        expect(printer.printEntityScope('toString' as EntityScope)).toBe('toString')
        expect(printer.printPriceInnerRecordHandling('Average' as PriceInnerRecordHandling)).toBe('Average')
    })
})
