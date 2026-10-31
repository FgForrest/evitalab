import { DateTime } from 'luxon'
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
import { Range } from '@/modules/database-driver/data-type/Range'
import { Uuid } from '@/modules/database-driver/data-type/Uuid'
import type { ValuePrinter } from '@/modules/value-presentation/service/ValuePrinter'
import { PrimitiveValuePrinter } from '@/modules/value-presentation/service/PrimitiveValuePrinter'
import { DataTypeValuePrinter } from '@/modules/value-presentation/service/DataTypeValuePrinter'
import { RangeValuePrinter } from '@/modules/value-presentation/service/RangeValuePrinter'
import { ArrayValuePrinter } from '@/modules/value-presentation/service/ArrayValuePrinter'

/**
 * Prints `String` and `Character` values.
 */
const stringValuePrinter: ValuePrinter<string> = new PrimitiveValuePrinter<string>()
/**
 * Prints `Byte`, `Short` and `Integer` values.
 */
const numberValuePrinter: ValuePrinter<number> = new PrimitiveValuePrinter<number>()
/**
 * Prints `Long` values.
 */
const bigintValuePrinter: ValuePrinter<bigint> = new PrimitiveValuePrinter<bigint>()
/**
 * Prints `Boolean` values.
 */
const booleanValuePrinter: ValuePrinter<boolean> = new PrimitiveValuePrinter<boolean>()
/**
 * Prints `ComplexDataObject` values (plain JSON structures) as JSON.
 */
const complexDataValuePrinter: ValuePrinter<object> = new PrimitiveValuePrinter<object>()

/**
 * Prints values whose canonical form is also their human-readable form.
 */
const canonicalFormValuePrinter: DataTypeValuePrinter<BigDecimal | Locale | Currency | Uuid | Predecessor | Range<unknown>> =
    new DataTypeValuePrinter(value => value.toString())

/**
 * Prints `BigDecimal` values.
 */
const bigDecimalValuePrinter: ValuePrinter<BigDecimal> = canonicalFormValuePrinter
/**
 * Prints `Locale` values.
 */
const localeValuePrinter: ValuePrinter<Locale> = canonicalFormValuePrinter
/**
 * Prints `Currency` values.
 */
const currencyValuePrinter: ValuePrinter<Currency> = canonicalFormValuePrinter
/**
 * Prints `UUID` values.
 */
const uuidValuePrinter: ValuePrinter<Uuid> = canonicalFormValuePrinter
/**
 * Prints `Predecessor` and `ReferencedEntityPredecessor` values, the head of the list as `Head`.
 */
const predecessorValuePrinter: ValuePrinter<Predecessor> = canonicalFormValuePrinter

/**
 * Prints `OffsetDateTime` values. The value is printed in its own offset, not in the viewer's time zone, so the offset
 * marker is part of the text — a timestamp created by a server in another zone must not silently shift.
 */
const offsetDateTimeValuePrinter: ValuePrinter<OffsetDateTime> = new DataTypeValuePrinter<OffsetDateTime>(
    value => value.toDateTime().toLocaleString({ dateStyle: 'short', timeStyle: 'long' })
)

/**
 * Prints an end of a `DateTimeRange` in its own offset like {@link offsetDateTimeValuePrinter}, only with the longer
 * date style suitable for ranges.
 */
const dateTimeRangeEndValuePrinter: ValuePrinter<OffsetDateTime> = new DataTypeValuePrinter<OffsetDateTime>(
    value => value.toDateTime().toLocaleString({ dateStyle: 'medium', timeStyle: 'long' })
)

/**
 * Prints `LocalDateTime` values. `new Date(...)` reads an offset-less ISO date-time as a wall-clock value in the
 * viewer's zone, which is then formatted in the same zone, so the wall-clock value is kept.
 */
const localDateTimeValuePrinter: ValuePrinter<LocalDateTime> = new DataTypeValuePrinter<LocalDateTime>(
    value => new Intl.DateTimeFormat([], { dateStyle: 'medium', timeStyle: 'medium' }).format(new Date(value.isoDate))
)

/**
 * Prints `LocalDate` values. Parsed by Luxon rather than by `new Date(...)`, which reads a bare ISO date as UTC
 * midnight and would print the previous day for viewers behind Greenwich.
 */
const localDateValuePrinter: ValuePrinter<LocalDate> = new DataTypeValuePrinter<LocalDate>(
    value => DateTime.fromISO(value.isoDate).toLocaleString({ dateStyle: 'medium' })
)

/**
 * Prints `LocalTime` values. `new Date(...)` rejects a bare ISO time outright; Luxon reads it against the current day,
 * which the format drops.
 */
const localTimeValuePrinter: ValuePrinter<LocalTime> = new DataTypeValuePrinter<LocalTime>(
    value => DateTime.fromISO(value.isoTime).toLocaleString({ timeStyle: 'medium' })
)

/**
 * Prints `DateTimeRange` values as `[from,to]`.
 */
const dateTimeRangeValuePrinter: ValuePrinter<DateTimeRange> = new RangeValuePrinter<OffsetDateTime>(
    dateTimeRangeEndValuePrinter,
    { prefix: '[', separator: ',', suffix: ']' }
)
/**
 * Prints `ByteNumberRange`, `ShortNumberRange` and `IntegerNumberRange` values as `from,to`.
 */
const integerRangeValuePrinter: ValuePrinter<IntegerRange> = new RangeValuePrinter<number>(
    numberValuePrinter,
    { prefix: '', separator: ',', suffix: '' }
)
/**
 * Prints `LongNumberRange` values as `[from, to]`.
 */
const bigintRangeValuePrinter: ValuePrinter<BigintNumberRange> = new RangeValuePrinter<bigint>(
    bigintValuePrinter,
    { prefix: '[', separator: ', ', suffix: ']' }
)
/**
 * Prints `BigDecimalNumberRange` values as `[from,to]`.
 */
const bigDecimalRangeValuePrinter: ValuePrinter<BigDecimalNumberRange> = new RangeValuePrinter<BigDecimal>(
    bigDecimalValuePrinter,
    { prefix: '[', separator: ',', suffix: ']' }
)

/**
 * Printer of every {@link Scalar}. The mapped type is exhaustive: a new scalar does not compile until it gets a printer.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- each scalar has a different model type, the key decides which
export type ScalarValuePrinterTable = { readonly [S in Scalar]: ValuePrinter<any> }

/**
 * Default printers of all scalars.
 */
export const defaultScalarValuePrinters: ScalarValuePrinterTable = {
    [Scalar.String]: stringValuePrinter,
    [Scalar.StringArray]: new ArrayValuePrinter(stringValuePrinter),
    [Scalar.Byte]: numberValuePrinter,
    [Scalar.ByteArray]: new ArrayValuePrinter(numberValuePrinter),
    [Scalar.Short]: numberValuePrinter,
    [Scalar.ShortArray]: new ArrayValuePrinter(numberValuePrinter),
    [Scalar.Integer]: numberValuePrinter,
    [Scalar.IntegerArray]: new ArrayValuePrinter(numberValuePrinter),
    [Scalar.Long]: bigintValuePrinter,
    [Scalar.LongArray]: new ArrayValuePrinter(bigintValuePrinter),
    [Scalar.Boolean]: booleanValuePrinter,
    [Scalar.BooleanArray]: new ArrayValuePrinter(booleanValuePrinter),
    [Scalar.Character]: stringValuePrinter,
    [Scalar.CharacterArray]: new ArrayValuePrinter(stringValuePrinter),
    [Scalar.BigDecimal]: bigDecimalValuePrinter,
    [Scalar.BigDecimalArray]: new ArrayValuePrinter(bigDecimalValuePrinter),
    [Scalar.OffsetDateTime]: offsetDateTimeValuePrinter,
    [Scalar.OffsetDateTimeArray]: new ArrayValuePrinter(offsetDateTimeValuePrinter),
    [Scalar.LocalDateTime]: localDateTimeValuePrinter,
    [Scalar.LocalDateTimeArray]: new ArrayValuePrinter(localDateTimeValuePrinter),
    [Scalar.LocalDate]: localDateValuePrinter,
    [Scalar.LocalDateArray]: new ArrayValuePrinter(localDateValuePrinter),
    [Scalar.LocalTime]: localTimeValuePrinter,
    [Scalar.LocalTimeArray]: new ArrayValuePrinter(localTimeValuePrinter),
    [Scalar.DateTimeRange]: dateTimeRangeValuePrinter,
    [Scalar.DateTimeRangeArray]: new ArrayValuePrinter(dateTimeRangeValuePrinter),
    [Scalar.BigDecimalNumberRange]: bigDecimalRangeValuePrinter,
    [Scalar.BigDecimalNumberRangeArray]: new ArrayValuePrinter(bigDecimalRangeValuePrinter),
    [Scalar.ByteNumberRange]: integerRangeValuePrinter,
    [Scalar.ByteNumberRangeArray]: new ArrayValuePrinter(integerRangeValuePrinter),
    [Scalar.ShortNumberRange]: integerRangeValuePrinter,
    [Scalar.ShortNumberRangeArray]: new ArrayValuePrinter(integerRangeValuePrinter),
    [Scalar.IntegerNumberRange]: integerRangeValuePrinter,
    [Scalar.IntegerNumberRangeArray]: new ArrayValuePrinter(integerRangeValuePrinter),
    [Scalar.LongNumberRange]: bigintRangeValuePrinter,
    [Scalar.LongNumberRangeArray]: new ArrayValuePrinter(bigintRangeValuePrinter),
    [Scalar.Locale]: localeValuePrinter,
    [Scalar.LocaleArray]: new ArrayValuePrinter(localeValuePrinter),
    [Scalar.Currency]: currencyValuePrinter,
    [Scalar.CurrencyArray]: new ArrayValuePrinter(currencyValuePrinter),
    [Scalar.UUID]: uuidValuePrinter,
    [Scalar.UUIDArray]: new ArrayValuePrinter(uuidValuePrinter),
    [Scalar.Predecessor]: predecessorValuePrinter,
    [Scalar.ReferencedEntityPredecessor]: predecessorValuePrinter,
    [Scalar.ComplexDataObject]: complexDataValuePrinter,
}

/**
 * A driver data type class. Typed by its prototype, because abstract classes and classes with non-public constructors
 * (`Range`, `Uuid`) are not assignable to a constructor type; values are matched against the prototype.
 */
export type DataTypeClass = { readonly prototype: object }

/**
 * Printers of the driver's data types by their class, for callers that hold a value but no {@link Scalar}. The same
 * printer instances as in {@link defaultScalarValuePrinters}. The first match wins, so a subclass must precede its
 * base class (`DateTimeRange` before `Range`).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- each class has a different model type, the class decides which
export const defaultDataTypeValuePrinters: ReadonlyArray<readonly [DataTypeClass, ValuePrinter<any>]> = [
    [DateTimeRange, dateTimeRangeValuePrinter],
    [IntegerRange, integerRangeValuePrinter],
    [BigintNumberRange, bigintRangeValuePrinter],
    [BigDecimalNumberRange, bigDecimalRangeValuePrinter],
    [Range, canonicalFormValuePrinter],
    [OffsetDateTime, offsetDateTimeValuePrinter],
    [LocalDateTime, localDateTimeValuePrinter],
    [LocalDate, localDateValuePrinter],
    [LocalTime, localTimeValuePrinter],
    [BigDecimal, bigDecimalValuePrinter],
    [Locale, localeValuePrinter],
    [Currency, currencyValuePrinter],
    [Uuid, uuidValuePrinter],
    [Predecessor, predecessorValuePrinter],
]
