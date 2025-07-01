import { BigDecimal } from '@/modules/database-driver/data-type/BigDecimal'
import { BigDecimalNumberRange } from '@/modules/database-driver/data-type/BigDecimalNumberRange'
import { BigintNumberRange } from '@/modules/database-driver/data-type/BigintNumberRange'
import { DateTimeRange } from '@/modules/database-driver/data-type/DateTimeRange'
import { IntegerRange } from '@/modules/database-driver/data-type/IntegerRange'
import { LocalDate } from '@/modules/database-driver/data-type/LocalDate'
import { LocalDateTime } from '@/modules/database-driver/data-type/LocalDateTime'
import { LocalTime } from '@/modules/database-driver/data-type/LocalTime'
import { OffsetDateTime, Timestamp } from '@/modules/database-driver/data-type/OffsetDateTime'
import { Predecessor } from '@/modules/database-driver/data-type/Predecessor'
import { Uuid } from '@/modules/database-driver/data-type/Uuid'
import { List as ImmutableList } from 'immutable'
import type {
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
    GrpcDataItem
} from '@/modules/database-driver/connector/grpc/gen/GrpcEvitaDataTypes_pb'
import { DateTime } from 'luxon'
import { Range } from '@/modules/database-driver/data-type/Range'
import { GrpcEvitaDataType } from '@/modules/database-driver/connector/grpc/gen/GrpcEnums_pb'
import { Currency } from '@/modules/database-driver/data-type/Currency'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { Locale } from '@/modules/database-driver/data-type/Locale'
import type { Timestamp as GrpcTimestamp } from '@bufbuild/protobuf/wkt'

/**
 * Convert gRPC evita value server representation into local evitaLab typescript representation
 */
export class EvitaValueConverter {

    convertGrpcValue(value: string | GrpcEvitaValue | GrpcDataItem | undefined, valueCase: string | undefined): any {
        if (typeof value === 'string') {
            return value
        } else if (value == undefined) {
            return undefined
        } else if (valueCase === 'root') {
            // https://github.com/FgForrest/evitalab/issues/290
            throw new Error('Not implemented yet: https://github.com/FgForrest/evitalab/issues/290')
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
        return new BigDecimalNumberRange(
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
        return new BigintNumberRange(value.from, value.to)
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
        return Uuid.fromBits(BigInt(grpcUuid.mostSignificantBits), BigInt(grpcUuid.leastSignificantBits))
    }

    convertUuid(uuid: Uuid): GrpcUuid {
        return {
            mostSignificantBits: uuid.mostSignificantBits.toString(),
            leastSignificantBits: uuid.leastSignificantBits.toString()
        } as GrpcUuid
    }

    convertGrpcPredecessor(value: GrpcPredecessor): Predecessor {
        return new Predecessor(
            value.head,
            value.head ? -1 : value.predecessorId
        )
    }

    convertGrpcStringArray(value: GrpcStringArray): ImmutableList<string> {
        return ImmutableList(value.value)
    }

    convertGrpcIntegerArray(
        value: GrpcIntegerArray
    ): ImmutableList<number> {
        return ImmutableList(value.value)
    }

    convertGrpcLongArray(value: GrpcLongArray): ImmutableList<bigint> {
        return ImmutableList(value.value.map(BigInt))
    }

    convertGrpcBooleanArray(
        value: GrpcBooleanArray
    ): ImmutableList<boolean> {
        return ImmutableList(value.value)
    }

    convertGrpcBigDecimalArray(
        value: GrpcBigDecimalArray
    ): ImmutableList<BigDecimal> {
        const newBigDecimalArray: BigDecimal[] = []
        for (const grpcDecimal of value.value) {
            newBigDecimalArray.push(new BigDecimal(grpcDecimal.valueString))
        }

        return ImmutableList(newBigDecimalArray)
    }

    convertGrpcOffsetDateTimeArray(
        value: GrpcOffsetDateTimeArray
    ): ImmutableList<OffsetDateTime> {
        const offsetDateTimeArray: OffsetDateTime[] = []
        for (const grpcDateTime of value.value) {
            offsetDateTimeArray.push(this.convertGrpcOffsetDateTime(grpcDateTime))
        }
        return ImmutableList(offsetDateTimeArray)
    }

    convertGrpcLocalDateTimeArray(
        value: GrpcOffsetDateTimeArray
    ): ImmutableList<LocalDateTime> {
        const localeDateTimeArray: LocalDateTime[] = []
        for (const grpcDateTime of value.value) {
            localeDateTimeArray.push(this.convertGrpcLocalDateTime(grpcDateTime))
        }
        return ImmutableList(localeDateTimeArray)
    }

    convertGrpcLocalDateArray(
        value: GrpcOffsetDateTimeArray
    ): ImmutableList<LocalDate> {
        const localDateArray: LocalDate[] = []
        for (const localDate of value.value) {
            localDateArray.push(this.convertGrpcLocalDate(localDate))
        }
        return ImmutableList(localDateArray)
    }

    convertGrpcLocalTimeArray(
        value: GrpcOffsetDateTimeArray
    ): ImmutableList<LocalTime> {
        const localTimeArray: LocalTime[] = []
        for (const localTime of value.value) {
            localTimeArray.push(this.convertGrpcLocalTime(localTime))
        }
        return ImmutableList(localTimeArray)
    }

    convertGrpcDateTimeRangeArray(
        value: GrpcDateTimeRangeArray
    ): ImmutableList<DateTimeRange> {
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
        return ImmutableList(dateTimeRange)
    }

    convertGrpcBigDecimalNumberRangeArray(
        value: GrpcBigDecimalNumberRangeArray
    ): ImmutableList<Range<BigDecimal>> {
        const bigDecimalRange: Range<BigDecimal>[] = []
        for (const grpcBigDecimalRange of value.value) {
            bigDecimalRange.push(
                new BigDecimalNumberRange(
                    grpcBigDecimalRange.from != undefined
                        ? new BigDecimal(grpcBigDecimalRange.from.valueString)
                        : undefined,
                    grpcBigDecimalRange.to != undefined
                        ? new BigDecimal(grpcBigDecimalRange.to.valueString)
                        : undefined
                )
            )
        }
        return ImmutableList(bigDecimalRange)
    }

    convertGrpcLongNumberRangeArray(
        value: GrpcLongNumberRangeArray
    ): ImmutableList<Range<bigint>> {
        const longNumberRangeArray: Range<bigint>[] = []
        for (const grpcLongRange of value.value) {
            longNumberRangeArray.push(
                new BigintNumberRange(grpcLongRange.from, grpcLongRange.to)
            )
        }
        return ImmutableList(longNumberRangeArray)
    }

    convertGrpcIntegerNumberRangeArray(
        value: GrpcIntegerNumberRangeArray
    ): ImmutableList<Range<number>> {
        const integerNumberRangeArray: Range<number>[] = []
        for (const grpcIntegerNumber of value.value) {
            integerNumberRangeArray.push(
                new IntegerRange(grpcIntegerNumber.from, grpcIntegerNumber.to)
            )
        }
        return ImmutableList(integerNumberRangeArray)
    }

    convertGrpcShortNumberRangeArray(
        value: GrpcIntegerNumberRangeArray
    ): ImmutableList<Range<number>> {
        const shortNumberRangeArray: Range<number>[] = []
        for (const grpcShortNumberRange of value.value) {
            shortNumberRangeArray.push(
                new IntegerRange(
                    grpcShortNumberRange.from,
                    grpcShortNumberRange.to
                )
            )
        }
        return ImmutableList(shortNumberRangeArray)
    }

    convertGrpcByteNumberRangeArray(
        value: GrpcIntegerNumberRangeArray
    ): ImmutableList<Range<number>> {
        const byteNumberRangeArray: Range<number>[] = []
        for (const grpcIntegerNumber of value.value) {
            byteNumberRangeArray.push(
                new IntegerRange(grpcIntegerNumber.from, grpcIntegerNumber.to)
            )
        }
        return ImmutableList(byteNumberRangeArray)
    }

    convertGrpcLocaleArray(value: GrpcLocaleArray): ImmutableList<Locale> {
        const localeArray: Locale[] = []
        for (const locale of value.value) {
            localeArray.push(new Locale(locale.languageTag))
        }
        return ImmutableList(localeArray)
    }

    convertGrpcCurrencyArray(
        value: GrpcCurrencyArray
    ): ImmutableList<Currency> {
        const currencyArray: Currency[] = []
        for (const currency of value.value) {
            currencyArray.push(new Currency(currency.code))
        }
        return ImmutableList(currencyArray)
    }

    convertGrpcUuidArray(grpcUuids: GrpcUuidArray): ImmutableList<Uuid> {
        const uuids: Uuid[] = []
        for (const grpcUuid of grpcUuids.value) {
            uuids.push(this.convertGrpcUuid(grpcUuid))
        }
        return ImmutableList(uuids)
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
        return {
            timestamp: {
                nanos: offsetDateTime.timestamp.nanos,
                seconds: offsetDateTime.timestamp.seconds
            },
            offset: offsetDateTime.offset,

        } as GrpcOffsetDateTime
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
