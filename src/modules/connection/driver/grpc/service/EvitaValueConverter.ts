import { BigDecimal } from '@/modules/connection/model/data-type/BigDecimal'
import { BigDecimalRange } from '@/modules/connection/model/data-type/BigDecimalRange'
import { BigintRange } from '@/modules/connection/model/data-type/BigintRange'
import { DateTimeRange } from '@/modules/connection/model/data-type/DateTimeRange'
import { IntegerRange } from '@/modules/connection/model/data-type/IntegerRange'
import { LocalDate } from '@/modules/connection/model/data-type/LocalDate'
import { LocalDateTime } from '@/modules/connection/model/data-type/LocalDateTime'
import { Locale } from '@/modules/connection/model/data-type/Locale'
import { LocalTime } from '@/modules/connection/model/data-type/LocalTime'
import { OffsetDateTime, Timestamp } from '@/modules/connection/model/data-type/OffsetDateTime'
import { Predecessor } from '@/modules/connection/model/data-type/Predecessor'
import { Uuid } from '@/modules/connection/model/data-type/Uuid'
import Immutable from 'immutable'
import {
    GrpcBigDecimal,
    GrpcOffsetDateTime,
    GrpcDateTimeRange,
    GrpcBigDecimalNumberRange,
    GrpcLongNumberRange,
    GrpcIntegerNumberRange,
    GrpcLocale,
    GrpcCurrency,
    GrpcUuid,
    GrpcPredecessor,
    GrpcStringArray,
    GrpcIntegerArray,
    GrpcLongArray,
    GrpcBooleanArray,
    GrpcBigDecimalArray,
    GrpcOffsetDateTimeArray,
    GrpcDateTimeRangeArray,
    GrpcBigDecimalNumberRangeArray,
    GrpcLongNumberRangeArray,
    GrpcIntegerNumberRangeArray,
    GrpcLocaleArray,
    GrpcCurrencyArray,
    GrpcUuidArray,
    GrpcEvitaValue,
} from '../gen/GrpcEvitaDataTypes_pb'
import { DateTime } from 'luxon'
import { Range } from '@/modules/connection/model/data-type/Range'
import { GrpcEvitaDataType } from '../gen/GrpcEnums_pb'
import { Currency } from '@/modules/connection/model/data-type/Currency'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { Timestamp as GrpcTimestamp } from '@bufbuild/protobuf'
import { convertUuidBitsToCode } from '@/utils/uuid'

/**
 * Convert gRPC evita value server representation into local evitaLab typescript representation
 */
export class EvitaValueConverter {

    convertGrpcValue(value: string | GrpcEvitaValue | undefined): any {
        if (typeof value === 'string') {
            return value
        } else if (value == undefined) {
            return undefined
        } else {
            const val = value as GrpcEvitaValue
            const objectValue = val.value.value
            switch (val.type) {
                case GrpcEvitaDataType.BYTE:
                case GrpcEvitaDataType.BOOLEAN:
                case GrpcEvitaDataType.INTEGER:
                case GrpcEvitaDataType.LONG:
                case GrpcEvitaDataType.STRING:
                case GrpcEvitaDataType.SHORT:
                case GrpcEvitaDataType.CHARACTER:
                    return objectValue as object
                case GrpcEvitaDataType.BIG_DECIMAL:
                    return this.convertGrpcBigDecimal(objectValue as GrpcBigDecimal)
                case GrpcEvitaDataType.BIG_DECIMAL_ARRAY:
                    return this.convertGrpcBigDecimalArray(
                        objectValue as GrpcBigDecimalArray
                    )
                case GrpcEvitaDataType.BIG_DECIMAL_NUMBER_RANGE:
                    return this.convertGrpcBigDecimalNumberRange(
                        objectValue as GrpcBigDecimalNumberRange
                    )
                case GrpcEvitaDataType.BIG_DECIMAL_NUMBER_RANGE_ARRAY:
                    return this.convertGrpcBigDecimalNumberRangeArray(
                        objectValue as GrpcBigDecimalNumberRangeArray
                    )
                case GrpcEvitaDataType.BOOLEAN_ARRAY:
                    return this.convertGrpcBooleanArray(
                        objectValue as GrpcBooleanArray
                    )
                case GrpcEvitaDataType.BYTE_ARRAY:
                    return this.convertGrpcIntegerArray(
                        objectValue as GrpcIntegerArray
                    )
                case GrpcEvitaDataType.BYTE_NUMBER_RANGE:
                    return this.convertGrpcByteNumberRange(
                        objectValue as GrpcIntegerNumberRange
                    )
                case GrpcEvitaDataType.LONG_ARRAY:
                    return this.convertGrpcLongArray(objectValue as GrpcLongArray)
                case GrpcEvitaDataType.LONG_NUMBER_RANGE_ARRAY:
                    return this.convertGrpcLongNumberRangeArray(
                        objectValue as GrpcLongNumberRangeArray
                    )
                case GrpcEvitaDataType.SHORT_NUMBER_RANGE:
                    return this.convertGrpcShortNumberRangeArray(
                        objectValue as GrpcIntegerNumberRangeArray
                    )
                case GrpcEvitaDataType.SHORT_ARRAY:
                    return this.convertGrpcShortNumberRange(
                        objectValue as GrpcIntegerNumberRange
                    )
                case GrpcEvitaDataType.LOCALE:
                    return this.convertGrpcLocale(objectValue as GrpcLocale)
                case GrpcEvitaDataType.CURRENCY:
                    return this.convertGrpcCurrency(objectValue as GrpcCurrency)
                case GrpcEvitaDataType.BYTE_NUMBER_RANGE_ARRAY:
                    return this.convertGrpcByteNumberRangeArray(
                        objectValue as GrpcIntegerNumberRangeArray
                    )
                case GrpcEvitaDataType.CHARACTER_ARRAY:
                    return this.convertGrpcIntegerArray(
                        objectValue as GrpcIntegerArray
                    )
                case GrpcEvitaDataType.CURRENCY_ARRAY:
                    return this.convertGrpcCurrencyArray(
                        objectValue as GrpcCurrencyArray
                    )
                case GrpcEvitaDataType.DATE_TIME_RANGE_ARRAY:
                    return this.convertGrpcDateTimeRangeArray(
                        objectValue as GrpcDateTimeRangeArray
                    )
                case GrpcEvitaDataType.INTEGER_ARRAY:
                    return this.convertGrpcIntegerArray(
                        objectValue as GrpcIntegerArray
                    )
                case GrpcEvitaDataType.INTEGER_NUMBER_RANGE:
                    return this.convertGrpcIntegerNumberRange(
                        objectValue as GrpcIntegerNumberRange
                    )
                case GrpcEvitaDataType.INTEGER_NUMBER_RANGE_ARRAY:
                    return this.convertGrpcIntegerNumberRangeArray(
                        objectValue as GrpcIntegerNumberRangeArray
                    )
                case GrpcEvitaDataType.PREDECESSOR:
                    return this.convertGrpcPredecessor(
                        objectValue as GrpcPredecessor
                    )
                case GrpcEvitaDataType.REFERENCED_ENTITY_PREDECESSOR:
                    return this.convertGrpcPredecessor(
                        objectValue as GrpcPredecessor
                    )
                case GrpcEvitaDataType.SHORT_NUMBER_RANGE_ARRAY:
                    return this.convertGrpcIntegerNumberRangeArray(
                        objectValue as GrpcIntegerNumberRangeArray
                    )
                case GrpcEvitaDataType.STRING_ARRAY:
                    return this.convertGrpcStringArray(
                        objectValue as GrpcStringArray
                    )
                case GrpcEvitaDataType.UUID:
                    return this.convertGrpcUuid(objectValue as GrpcUuid)
                case GrpcEvitaDataType.UUID_ARRAY:
                    return this.convertGrpcUuidArray(objectValue as GrpcUuidArray)
                case GrpcEvitaDataType.OFFSET_DATE_TIME_ARRAY:
                    return this.convertGrpcOffsetDateTimeArray(
                        objectValue as GrpcOffsetDateTimeArray
                    )
                case GrpcEvitaDataType.DATE_TIME_RANGE:
                    return this.convertGrpcDateTimeRange(
                        objectValue as GrpcDateTimeRange
                    )
                case GrpcEvitaDataType.LOCALE_ARRAY:
                    return this.convertGrpcLocaleArray(
                        objectValue as GrpcLocaleArray
                    )
                case GrpcEvitaDataType.LOCAL_DATE:
                    return this.convertGrpcLocalDate(
                        objectValue as GrpcOffsetDateTime
                    )
                case GrpcEvitaDataType.LOCAL_DATE_ARRAY:
                    return this.convertGrpcLocalDateArray(
                        objectValue as GrpcOffsetDateTimeArray
                    )
                case GrpcEvitaDataType.LOCAL_DATE_TIME:
                    return this.convertGrpcLocalDateTime(
                        objectValue as GrpcOffsetDateTime
                    )
                case GrpcEvitaDataType.LOCAL_DATE_TIME_ARRAY:
                    return this.convertGrpcLocalDateTimeArray(
                        objectValue as GrpcOffsetDateTimeArray
                    )
                case GrpcEvitaDataType.LOCAL_TIME:
                    return this.convertGrpcLocalTime(
                        objectValue as GrpcOffsetDateTime
                    )
                case GrpcEvitaDataType.LOCAL_TIME_ARRAY:
                    return this.convertGrpcLocalTimeArray(
                        objectValue as GrpcOffsetDateTimeArray
                    )
                case GrpcEvitaDataType.LONG_NUMBER_RANGE:
                    return this.convertGrpcLongNumberRange(
                        objectValue as GrpcLongNumberRange
                    )
                case GrpcEvitaDataType.OFFSET_DATE_TIME:
                    return this.convertGrpcOffsetDateTime(
                        objectValue as GrpcOffsetDateTime
                    )
                default:
                    throw new UnexpectedError(`Unsupported evita data type '${val.type}'.`)
            }
        }
    }

    convertGrpcBigDecimal(value: GrpcBigDecimal): BigDecimal {
        return new BigDecimal(value.valueString)
    }

    convertGrpcDateTimeRange(value: GrpcDateTimeRange): DateTimeRange {
        if (!this.checkGrpcDateTimeValidity(value.from, value.to, false))
            throw new Error('DateTimeRange has undefined prop from and to')
        else
            return new DateTimeRange(
                value.from != undefined
                    ? this.convertGrpcOffsetDateTime(value.from!)
                    : undefined,
                value.to != undefined
                    ? this.convertGrpcOffsetDateTime(value.to!)
                    : undefined
            )
    }

    convertGrpcBigDecimalNumberRange(
        value: GrpcBigDecimalNumberRange
    ): Range<BigDecimal> {
        return new BigDecimalRange(
            value.from != undefined
                ? new BigDecimal(value.from.valueString)
                : undefined,
            value.to != undefined
                ? new BigDecimal(value.to.valueString)
                : undefined
        )
    }

    convertGrpcLongNumberRange(value: GrpcLongNumberRange): Range<bigint> {
        if (this.checkNumberRangeValidity(value.from, value.to))
            throw new Error('LongRangeNumber has undefined prop from and to')
        return new BigintRange(value.from, value.to)
    }

    convertGrpcIntegerNumberRange(
        value: GrpcIntegerNumberRange
    ): Range<number> {
        if (this.checkNumberRangeValidity(value.from, value.to))
            throw new Error('IntegerRangeNumber has undefined prop from and to')
        return new IntegerRange(value.from, value.to)
    }

    convertGrpcShortNumberRange(
        value: GrpcIntegerNumberRange
    ): Range<number> {
        if (this.checkNumberRangeValidity(value.from, value.to))
            throw new Error('ShortRangeNumber has undefined prop from and to')
        return new IntegerRange(value.from, value.to)
    }

    convertGrpcByteNumberRange(
        value: GrpcIntegerNumberRange
    ): Range<number> {
        if (this.checkNumberRangeValidity(value.from, value.to))
            throw new Error('ByteRangeNumber has undefined prop from and to')
        return new IntegerRange(value.from, value.to)
    }

    convertGrpcLocale(value: GrpcLocale): Locale {
        return new Locale(value.languageTag)
    }

    convertGrpcCurrency(value: GrpcCurrency): Currency {
        return new Currency(value.code)
    }

    convertGrpcUuid(grpcUuid: GrpcUuid): Uuid {
        return Uuid.fromBits(grpcUuid.mostSignificantBits, grpcUuid.leastSignificantBits)
    }

    convertUuid(uuid: Uuid): GrpcUuid {
        return new GrpcUuid({
            mostSignificantBits: uuid.mostSignificantBits,
            leastSignificantBits: uuid.leastSignificantBits,
        })
    }

    convertGrpcPredecessor(value: GrpcPredecessor): Predecessor {
        return new Predecessor(
            value.head,
            value.head ? -1 : value.predecessorId
        )
    }

    convertGrpcStringArray(value: GrpcStringArray): Immutable.List<string> {
        return Immutable.List(value.value)
    }

    convertGrpcIntegerArray(
        value: GrpcIntegerArray
    ): Immutable.List<number> {
        return Immutable.List(value.value)
    }

    convertGrpcLongArray(value: GrpcLongArray): Immutable.List<bigint> {
        return Immutable.List(value.value)
    }

    convertGrpcBooleanArray(
        value: GrpcBooleanArray
    ): Immutable.List<boolean> {
        return Immutable.List(value.value)
    }

    convertGrpcBigDecimalArray(
        value: GrpcBigDecimalArray
    ): Immutable.List<BigDecimal> {
        const newBigDecimalArray: BigDecimal[] = []
        for (const grpcDecimal of value.value) {
            newBigDecimalArray.push(new BigDecimal(grpcDecimal.valueString))
        }

        return Immutable.List(newBigDecimalArray)
    }

    convertGrpcOffsetDateTimeArray(
        value: GrpcOffsetDateTimeArray
    ): Immutable.List<OffsetDateTime> {
        const offsetDateTimeArray: OffsetDateTime[] = []
        for (const grpcDateTime of value.value) {
            offsetDateTimeArray.push(this.convertGrpcOffsetDateTime(grpcDateTime))
        }
        return Immutable.List(offsetDateTimeArray)
    }

    convertGrpcLocalDateTimeArray(
        value: GrpcOffsetDateTimeArray
    ): Immutable.List<LocalDateTime> {
        const localeDateTimeArray: LocalDateTime[] = []
        for (const grpcDateTime of value.value) {
            localeDateTimeArray.push(this.convertGrpcLocalDateTime(grpcDateTime))
        }
        return Immutable.List(localeDateTimeArray)
    }

    convertGrpcLocalDateArray(
        value: GrpcOffsetDateTimeArray
    ): Immutable.List<LocalDate> {
        const localDateArray: LocalDate[] = []
        for (const localDate of value.value) {
            localDateArray.push(this.convertGrpcLocalDate(localDate))
        }
        return Immutable.List(localDateArray)
    }

    convertGrpcLocalTimeArray(
        value: GrpcOffsetDateTimeArray
    ): Immutable.List<LocalTime> {
        const localTimeArray: LocalTime[] = []
        for (const localTime of value.value) {
            localTimeArray.push(this.convertGrpcLocalTime(localTime))
        }
        return Immutable.List(localTimeArray)
    }

    convertGrpcDateTimeRangeArray(
        value: GrpcDateTimeRangeArray
    ): Immutable.List<DateTimeRange> {
        const dateTimeRange: DateTimeRange[] = []
        for (const grpcDateTimeRange of value.value) {
            if (
                this.checkGrpcDateTimeValidity(
                    grpcDateTimeRange.from,
                    grpcDateTimeRange.to,
                    false
                )
            ) {
                dateTimeRange.push(
                    new DateTimeRange(
                        grpcDateTimeRange.from != undefined
                            ? this.convertGrpcOffsetDateTime(grpcDateTimeRange.from!)
                            : undefined,
                        grpcDateTimeRange.to != undefined
                            ? this.convertGrpcOffsetDateTime(grpcDateTimeRange.to!)
                            : undefined
                    )
                )
            }
        }
        return Immutable.List(dateTimeRange)
    }

    convertGrpcBigDecimalNumberRangeArray(
        value: GrpcBigDecimalNumberRangeArray
    ): Immutable.List<Range<BigDecimal>> {
        const bigDecimalRange: Range<BigDecimal>[] = []
        for (const grpcBigDecimalRange of value.value) {
            bigDecimalRange.push(
                new BigDecimalRange(
                    grpcBigDecimalRange.from != undefined
                        ? new BigDecimal(grpcBigDecimalRange.from.valueString)
                        : undefined,
                    grpcBigDecimalRange.to != undefined
                        ? new BigDecimal(grpcBigDecimalRange.to.valueString)
                        : undefined
                )
            )
        }
        return Immutable.List(bigDecimalRange)
    }

    convertGrpcLongNumberRangeArray(
        value: GrpcLongNumberRangeArray
    ): Immutable.List<Range<bigint>> {
        const longNumberRangeArray: Range<bigint>[] = []
        for (const grpcLongRange of value.value) {
            longNumberRangeArray.push(
                new BigintRange(grpcLongRange.from, grpcLongRange.to)
            )
        }
        return Immutable.List(longNumberRangeArray)
    }

    convertGrpcIntegerNumberRangeArray(
        value: GrpcIntegerNumberRangeArray
    ): Immutable.List<Range<number>> {
        const integerNumberRangeArray: Range<number>[] = []
        for (const grpcIntegerNumber of value.value) {
            integerNumberRangeArray.push(
                new IntegerRange(grpcIntegerNumber.from, grpcIntegerNumber.to)
            )
        }
        return Immutable.List(integerNumberRangeArray)
    }

    convertGrpcShortNumberRangeArray(
        value: GrpcIntegerNumberRangeArray
    ): Immutable.List<Range<number>> {
        const shortNumberRangeArray: Range<number>[] = []
        for (const grpcShortNumberRange of value.value) {
            shortNumberRangeArray.push(
                new IntegerRange(
                    grpcShortNumberRange.from,
                    grpcShortNumberRange.to
                )
            )
        }
        return Immutable.List(shortNumberRangeArray)
    }

    convertGrpcByteNumberRangeArray(
        value: GrpcIntegerNumberRangeArray
    ): Immutable.List<Range<number>> {
        const byteNumberRangeArray: Range<number>[] = []
        for (const grpcIntegerNumber of value.value) {
            byteNumberRangeArray.push(
                new IntegerRange(grpcIntegerNumber.from, grpcIntegerNumber.to)
            )
        }
        return Immutable.List(byteNumberRangeArray)
    }

    convertGrpcLocaleArray(value: GrpcLocaleArray): Immutable.List<Locale> {
        const localeArray: Locale[] = []
        for (const locale of value.value) {
            localeArray.push(new Locale(locale.languageTag))
        }
        return Immutable.List(localeArray)
    }

    convertGrpcCurrencyArray(
        value: GrpcCurrencyArray
    ): Immutable.List<Currency> {
        const currencyArray: Currency[] = []
        for (const currency of value.value) {
            currencyArray.push(new Currency(currency.code))
        }
        return Immutable.List(currencyArray)
    }

    convertGrpcUuidArray(grpcUuids: GrpcUuidArray): Immutable.List<Uuid> {
        const uuids: Uuid[] = []
        for (const grpcUuid of grpcUuids.value) {
            uuids.push(this.convertGrpcUuid(grpcUuid))
        }
        return Immutable.List(uuids)
    }

    convertGrpcLocalDate(offsetDateTime: GrpcOffsetDateTime): LocalDate {
        if (!offsetDateTime.timestamp) {
            throw new Error('Missing prop timestamp')
        }
        const localDate: LocalDate = new LocalDate(
            DateTime.fromSeconds(
                Number(offsetDateTime.timestamp.seconds)
            ).toISODate()
        )
        return localDate
    }

    convertGrpcLocalDateTime(offsetDateTime: GrpcOffsetDateTime): LocalDateTime {
        if (!offsetDateTime.timestamp) {
            throw new Error('Missing prop timestamp')
        }
        return new LocalDateTime(
            DateTime.fromSeconds(
                Number(offsetDateTime.timestamp.seconds)
            ).toISO()
        )
    }

    convertGrpcOffsetDateTime(
        offsetDateTime: GrpcOffsetDateTime
    ): OffsetDateTime {
        if (!offsetDateTime.timestamp) {
            throw new Error('Missing prop timestamp')
        }
        return new OffsetDateTime(
            this.convertGrpcTimestamp(offsetDateTime.timestamp),
            offsetDateTime.offset
        )
    }

    convertOffsetDateTime(offsetDateTime: OffsetDateTime): GrpcOffsetDateTime {
        return new GrpcOffsetDateTime({
            timestamp: offsetDateTime.timestamp,
            offset: offsetDateTime.offset
        })
    }

    convertGrpcLocalTime(grpcTime: GrpcOffsetDateTime): LocalTime {
        if (!grpcTime.timestamp) {
            throw new Error('Missing prop timestamp')
        }
        const localTime: LocalTime = new LocalTime(
            DateTime.fromSeconds(Number(grpcTime.timestamp.seconds)).toISOTime()
        )
        return localTime
    }

    private convertGrpcTimestamp(grpcTimestamp: GrpcTimestamp): Timestamp {
        return new Timestamp(
            grpcTimestamp.seconds,
            grpcTimestamp.nanos
        )
    }

    private checkGrpcDateTimeValidity(
        from: GrpcOffsetDateTime | undefined,
        to: GrpcOffsetDateTime | undefined,
        hasOffset: boolean
    ): boolean {
        if (!from && !to) {
            return false
        } else if (from && to && !from.timestamp && !to.timestamp) {
            return false
        } else if (
            hasOffset &&
            ((from && from.timestamp && !from.offset) ||
                (to && to.timestamp && !to.offset))
        ) {
            return false
        } else {
            return true
        }
    }

    private checkNumberRangeValidity(
        from: number | bigint | undefined,
        to: number | bigint | undefined
    ): boolean {
        if (!from && !to) {
            return false
        } else {
            return true
        }
    }
}
