import { BigDecimal } from '@/modules/connection/model/data-type/BigDecimal'
import { BigDecimalRange } from '@/modules/connection/model/data-type/BigDecimalRange'
import { BigintRange } from '@/modules/connection/model/data-type/BigintRange'
import { DateTimeRange } from '@/modules/connection/model/data-type/DateTimeRange'
import { IntegerRange } from '@/modules/connection/model/data-type/IntegerRange'
import { LocalDate } from '@/modules/connection/model/data-type/LocalDate'
import { LocalDateTime } from '@/modules/connection/model/data-type/LocalDateTime'
import { Locale } from '@/modules/connection/model/data-type/Locale'
import { LocalTime } from '@/modules/connection/model/data-type/LocalTime'
import { OffsetDateTime } from '@/modules/connection/model/data-type/OffsetDateTime'
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

/**
 * Convert gRPC evita value server representation into local evitaLab typescript representation
 */
export class EvitaValueConverter {

    convert(value: string | GrpcEvitaValue | undefined): any {
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
                    return this.convertBigDecimal(objectValue as GrpcBigDecimal)
                case GrpcEvitaDataType.BIG_DECIMAL_ARRAY:
                    return this.convertBigDecimalArray(
                        objectValue as GrpcBigDecimalArray
                    )
                case GrpcEvitaDataType.BIG_DECIMAL_NUMBER_RANGE:
                    return this.convertBigDecimalNumberRange(
                        objectValue as GrpcBigDecimalNumberRange
                    )
                case GrpcEvitaDataType.BIG_DECIMAL_NUMBER_RANGE_ARRAY:
                    return this.convertBigDecimalNumberRangeArray(
                        objectValue as GrpcBigDecimalNumberRangeArray
                    )
                case GrpcEvitaDataType.BOOLEAN_ARRAY:
                    return this.convertBooleanArray(
                        objectValue as GrpcBooleanArray
                    )
                case GrpcEvitaDataType.BYTE_ARRAY:
                    return this.convertIntegerArray(
                        objectValue as GrpcIntegerArray
                    )
                case GrpcEvitaDataType.BYTE_NUMBER_RANGE:
                    return this.convertByteNumberRange(
                        objectValue as GrpcIntegerNumberRange
                    )
                case GrpcEvitaDataType.LONG_ARRAY:
                    return this.convertLongArray(objectValue as GrpcLongArray)
                case GrpcEvitaDataType.LONG_NUMBER_RANGE_ARRAY:
                    return this.convertLongNumberRangeArray(
                        objectValue as GrpcLongNumberRangeArray
                    )
                case GrpcEvitaDataType.SHORT_NUMBER_RANGE:
                    return this.convertShortNumberRangeArray(
                        objectValue as GrpcIntegerNumberRangeArray
                    )
                case GrpcEvitaDataType.SHORT_ARRAY:
                    return this.convertShortNumberRange(
                        objectValue as GrpcIntegerNumberRange
                    )
                case GrpcEvitaDataType.LOCALE:
                    return this.convertLocale(objectValue as GrpcLocale)
                case GrpcEvitaDataType.CURRENCY:
                    return this.convertCurrency(objectValue as GrpcCurrency)
                case GrpcEvitaDataType.BYTE_NUMBER_RANGE_ARRAY:
                    return this.convertByteNumberRangeArray(
                        objectValue as GrpcIntegerNumberRangeArray
                    )
                case GrpcEvitaDataType.CHARACTER_ARRAY:
                    return this.convertIntegerArray(
                        objectValue as GrpcIntegerArray
                    )
                case GrpcEvitaDataType.CURRENCY_ARRAY:
                    return this.convertCurrencyArray(
                        objectValue as GrpcCurrencyArray
                    )
                case GrpcEvitaDataType.DATE_TIME_RANGE_ARRAY:
                    return this.convertDateTimeRangeArray(
                        objectValue as GrpcDateTimeRangeArray
                    )
                case GrpcEvitaDataType.INTEGER_ARRAY:
                    return this.convertIntegerArray(
                        objectValue as GrpcIntegerArray
                    )
                case GrpcEvitaDataType.INTEGER_NUMBER_RANGE:
                    return this.convertIntegerNumberRange(
                        objectValue as GrpcIntegerNumberRange
                    )
                case GrpcEvitaDataType.INTEGER_NUMBER_RANGE_ARRAY:
                    return this.convertIntegerNumberRangeArray(
                        objectValue as GrpcIntegerNumberRangeArray
                    )
                case GrpcEvitaDataType.PREDECESSOR:
                    return this.convertPredecessor(
                        objectValue as GrpcPredecessor
                    )
                case GrpcEvitaDataType.REFERENCED_ENTITY_PREDECESSOR:
                    return this.convertPredecessor(
                        objectValue as GrpcPredecessor
                    )
                case GrpcEvitaDataType.SHORT_NUMBER_RANGE_ARRAY:
                    return this.convertIntegerNumberRangeArray(
                        objectValue as GrpcIntegerNumberRangeArray
                    )
                case GrpcEvitaDataType.STRING_ARRAY:
                    return this.convertStringArray(
                        objectValue as GrpcStringArray
                    )
                case GrpcEvitaDataType.UUID:
                    return this.convertUUID(objectValue as GrpcUuid)
                case GrpcEvitaDataType.UUID_ARRAY:
                    return this.convertUUIDArray(objectValue as GrpcUuidArray)
                case GrpcEvitaDataType.OFFSET_DATE_TIME_ARRAY:
                    return this.convertOffsetDateTimeArray(
                        objectValue as GrpcOffsetDateTimeArray
                    )
                case GrpcEvitaDataType.DATE_TIME_RANGE:
                    return this.convertDateTimeRange(
                        objectValue as GrpcDateTimeRange
                    )
                case GrpcEvitaDataType.LOCALE_ARRAY:
                    return this.convertLocaleArray(
                        objectValue as GrpcLocaleArray
                    )
                case GrpcEvitaDataType.LOCAL_DATE:
                    return this.convertLocalDate(
                        objectValue as GrpcOffsetDateTime
                    )
                case GrpcEvitaDataType.LOCAL_DATE_ARRAY:
                    return this.convertLocalDateArray(
                        objectValue as GrpcOffsetDateTimeArray
                    )
                case GrpcEvitaDataType.LOCAL_DATE_TIME:
                    return this.convertLocalDateTime(
                        objectValue as GrpcOffsetDateTime
                    )
                case GrpcEvitaDataType.LOCAL_DATE_TIME_ARRAY:
                    return this.convertLocalDateTimeArray(
                        objectValue as GrpcOffsetDateTimeArray
                    )
                case GrpcEvitaDataType.LOCAL_TIME:
                    return this.convertLocalTime(
                        objectValue as GrpcOffsetDateTime
                    )
                case GrpcEvitaDataType.LOCAL_TIME_ARRAY:
                    return this.convertLocalTimeArray(
                        objectValue as GrpcOffsetDateTimeArray
                    )
                case GrpcEvitaDataType.LONG_NUMBER_RANGE:
                    return this.convertLongNumberRange(
                        objectValue as GrpcLongNumberRange
                    )
                case GrpcEvitaDataType.OFFSET_DATE_TIME:
                    return this.convertOffsetDateTime(
                        objectValue as GrpcOffsetDateTime
                    )
                default:
                    throw new UnexpectedError(`Unsupported evita data type '${val.type}'.`)
            }
        }
    }

    convertBigDecimal(value: GrpcBigDecimal): BigDecimal {
        return new BigDecimal(value.valueString)
    }

    convertDateTimeRange(value: GrpcDateTimeRange): DateTimeRange {
        if (!this.checkDateTimeValidity(value.from, value.to, false))
            throw new Error('DateTimeRange has undefined prop from and to')
        else
            return new DateTimeRange(
                value.from != undefined ? new OffsetDateTime(value.from!.timestamp!, value.from!.offset) : undefined,
                value.to != undefined ? new OffsetDateTime(value.to!.timestamp!, value.to!.offset) : undefined
            )
    }

    convertBigDecimalNumberRange(
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

    convertLongNumberRange(value: GrpcLongNumberRange): Range<bigint> {
        if (this.checkNumberRangeValidity(value.from, value.to))
            throw new Error('LongRangeNumber has undefined prop from and to')
        return new BigintRange(value.from, value.to)
    }

    convertIntegerNumberRange(
        value: GrpcIntegerNumberRange
    ): Range<number> {
        if (this.checkNumberRangeValidity(value.from, value.to))
            throw new Error('IntegerRangeNumber has undefined prop from and to')
        return new IntegerRange(value.from, value.to)
    }

    convertShortNumberRange(
        value: GrpcIntegerNumberRange
    ): Range<number> {
        if (this.checkNumberRangeValidity(value.from, value.to))
            throw new Error('ShortRangeNumber has undefined prop from and to')
        return new IntegerRange(value.from, value.to)
    }

    convertByteNumberRange(
        value: GrpcIntegerNumberRange
    ): Range<number> {
        if (this.checkNumberRangeValidity(value.from, value.to))
            throw new Error('ByteRangeNumber has undefined prop from and to')
        return new IntegerRange(value.from, value.to)
    }

    convertLocale(value: GrpcLocale): Locale {
        return new Locale(value.languageTag)
    }

    convertCurrency(value: GrpcCurrency): Currency {
        return new Currency(value.code)
    }

    convertUUID(grpcUuid: GrpcUuid): Uuid {
        return new Uuid(grpcUuid.toJsonString(), grpcUuid.mostSignificantBits, grpcUuid.leastSignificantBits)
    }

    convertPredecessor(value: GrpcPredecessor): Predecessor {
        return new Predecessor(
            value.head,
            value.head ? -1 : value.predecessorId
        )
    }

    convertStringArray(value: GrpcStringArray): Immutable.List<string> {
        return Immutable.List(value.value)
    }

    convertIntegerArray(
        value: GrpcIntegerArray
    ): Immutable.List<number> {
        return Immutable.List(value.value)
    }

    convertLongArray(value: GrpcLongArray): Immutable.List<bigint> {
        return Immutable.List(value.value)
    }

    convertBooleanArray(
        value: GrpcBooleanArray
    ): Immutable.List<boolean> {
        return Immutable.List(value.value)
    }

    convertBigDecimalArray(
        value: GrpcBigDecimalArray
    ): Immutable.List<BigDecimal> {
        const newBigDecimalArray: BigDecimal[] = []
        for (const grpcDecimal of value.value) {
            newBigDecimalArray.push(new BigDecimal(grpcDecimal.valueString))
        }

        return Immutable.List(newBigDecimalArray)
    }

    convertOffsetDateTimeArray(
        value: GrpcOffsetDateTimeArray
    ): Immutable.List<OffsetDateTime> {
        const offsetDateTimeArray: OffsetDateTime[] = []
        for (const grpcDateTime of value.value) {
            offsetDateTimeArray.push(this.convertOffsetDateTime(grpcDateTime))
        }
        return Immutable.List(offsetDateTimeArray)
    }

    convertLocalDateTimeArray(
        value: GrpcOffsetDateTimeArray
    ): Immutable.List<LocalDateTime> {
        const localeDateTimeArray: LocalDateTime[] = []
        for (const grpcDateTime of value.value) {
            localeDateTimeArray.push(this.convertLocalDateTime(grpcDateTime))
        }
        return Immutable.List(localeDateTimeArray)
    }

    convertLocalDateArray(
        value: GrpcOffsetDateTimeArray
    ): Immutable.List<LocalDate> {
        const localDateArray: LocalDate[] = []
        for (const localDate of value.value) {
            localDateArray.push(this.convertLocalDate(localDate))
        }
        return Immutable.List(localDateArray)
    }

    convertLocalTimeArray(
        value: GrpcOffsetDateTimeArray
    ): Immutable.List<LocalTime> {
        const localTimeArray: LocalTime[] = []
        for (const localTime of value.value) {
            localTimeArray.push(this.convertLocalTime(localTime))
        }
        return Immutable.List(localTimeArray)
    }

    convertDateTimeRangeArray(
        value: GrpcDateTimeRangeArray
    ): Immutable.List<DateTimeRange> {
        const dateTimeRange: DateTimeRange[] = []
        for (const grpcDateTimeRange of value.value) {
            if (
                this.checkDateTimeValidity(
                    grpcDateTimeRange.from,
                    grpcDateTimeRange.to,
                    false
                )
            ) {
                dateTimeRange.push(
                    new DateTimeRange(
                        grpcDateTimeRange.from != undefined
                            ? new OffsetDateTime(
                                grpcDateTimeRange.from!.timestamp!,
                                grpcDateTimeRange.from!.offset
                            )
                            : undefined,
                        grpcDateTimeRange.to != undefined
                            ? new OffsetDateTime(
                                grpcDateTimeRange.to!.timestamp!,
                                grpcDateTimeRange.to!.offset
                            )
                            : undefined
                    )
                )
            }
        }
        return Immutable.List(dateTimeRange)
    }

    convertBigDecimalNumberRangeArray(
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

    convertLongNumberRangeArray(
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

    convertIntegerNumberRangeArray(
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

    convertShortNumberRangeArray(
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

    convertByteNumberRangeArray(
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

    convertLocaleArray(value: GrpcLocaleArray): Immutable.List<Locale> {
        const localeArray: Locale[] = []
        for (const locale of value.value) {
            localeArray.push(new Locale(locale.languageTag))
        }
        return Immutable.List(localeArray)
    }

    convertCurrencyArray(
        value: GrpcCurrencyArray
    ): Immutable.List<Currency> {
        const currencyArray: Currency[] = []
        for (const currency of value.value) {
            currencyArray.push(new Currency(currency.code))
        }
        return Immutable.List(currencyArray)
    }

    convertUUIDArray(grpcUuids: GrpcUuidArray): Immutable.List<Uuid> {
        const uuids: Uuid[] = []
        for (const grpcUuid of grpcUuids.value) {
            uuids.push(new Uuid(grpcUuid.toJsonString(), grpcUuid.mostSignificantBits, grpcUuid.leastSignificantBits))
        }
        return Immutable.List(uuids)
    }

    convertLocalDate(offsetDateTime: GrpcOffsetDateTime): LocalDate {
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

    convertLocalDateTime(offsetDateTime: GrpcOffsetDateTime): LocalDateTime {
        if (!offsetDateTime.timestamp) {
            throw new Error('Missing prop timestamp')
        }
        return new LocalDateTime(
            DateTime.fromSeconds(
                Number(offsetDateTime.timestamp.seconds)
            ).toISO()
        )
    }

    convertOffsetDateTime(
        offsetDateTime: GrpcOffsetDateTime
    ): OffsetDateTime {
        if (!offsetDateTime.timestamp) {
            throw new Error('Missing prop timestamp')
        }
        return new OffsetDateTime(
            offsetDateTime.timestamp,
            offsetDateTime.offset
        )
    }

    convertLocalTime(grpcTime: GrpcOffsetDateTime): LocalTime {
        if (!grpcTime.timestamp) {
            throw new Error('Missing prop timestamp')
        }
        const localTime: LocalTime = new LocalTime(
            DateTime.fromSeconds(Number(grpcTime.timestamp.seconds)).toISOTime()
        )
        return localTime
    }

    private checkDateTimeValidity(
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
