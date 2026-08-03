import type { EvitaValue } from '@/modules/database-driver/data-type/EvitaValue'
import { BigDecimal } from '@/modules/database-driver/data-type/BigDecimal'
import { BigDecimalNumberRange } from '@/modules/database-driver/data-type/BigDecimalNumberRange'
import { BigintNumberRange } from '@/modules/database-driver/data-type/BigintNumberRange'
import { DateTimeRange } from '@/modules/database-driver/data-type/DateTimeRange'
import { IntegerRange } from '@/modules/database-driver/data-type/IntegerRange'
import { LocalDate } from '@/modules/database-driver/data-type/LocalDate'
import { LocalDateTime } from '@/modules/database-driver/data-type/LocalDateTime'
import { LocalTime } from '@/modules/database-driver/data-type/LocalTime'
import { OffsetDateTime, Timestamp, toLuxonZone } from '@/modules/database-driver/data-type/OffsetDateTime'
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
    GrpcDataItem, GrpcEvitaAssociatedDataValue
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


    /**
     * Converts a single associated data value into its local representation. The server may send a complex data object
     * either as the deprecated JSON string or as the typed {@link GrpcDataItem} tree, therefore the dispatch must be
     * based on the actual oneof case, not on the `type` discriminator (which stays `COMPLEX_DATA_OBJECT` in both cases).
     */
    static convertGrpcAssociatedValue(value: GrpcEvitaAssociatedDataValue | undefined): EvitaValue {
        if (value == undefined) {
            throw new UnexpectedError('Unknown value type.')
        }
        switch (value.value.case) {
            case 'primitiveValue':
                return EvitaValueConverter.convertGrpcValue(value.value.value, value.value.case)
            case 'jsonValue':
                // deprecated form, still sent by servers that don't support the structured form
                return JSON.parse(value.value.value)
            case 'root':
                return EvitaValueConverter.convertGrpcDataItem(value.value.value)
            default:
                throw new UnexpectedError('Unknown associated data value type.')
        }
    }

    /**
     * Converts the typed complex data object tree into a plain JSON-compatible structure - maps become plain objects,
     * arrays plain arrays and leaves plain JSON values. The projection mirrors evitaDB's
     * `ComplexDataObjectToJsonConverter` so that the structured form renders identically to the deprecated JSON form.
     */
    static convertGrpcDataItem(dataItem: GrpcDataItem): EvitaValue {
        switch (dataItem.value.case) {
            case 'primitiveValue':
                return EvitaValueConverter.convertGrpcDataItemLeaf(dataItem.value.value)
            case 'arrayValue':
                return dataItem.value.value.children
                    .map(child => EvitaValueConverter.convertGrpcDataItem(child))
            case 'mapValue':
                return Object.fromEntries(
                    Object.entries(dataItem.value.value.data)
                        .map(([propertyName, property]) => [
                            propertyName,
                            EvitaValueConverter.convertGrpcDataItem(property)
                        ])
                )
            default:
                throw new UnexpectedError('Unsupported complex data object item.')
        }
    }

    static convertGrpcValue(value: string | GrpcEvitaValue | undefined, _valueCase: string | undefined): EvitaValue {
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
                    return EvitaValueConverter.convertGrpcBigDecimal(objectValue as GrpcBigDecimal)
                case GrpcEvitaDataType.BIG_DECIMAL_ARRAY:
                    return EvitaValueConverter.convertGrpcBigDecimalArray(
                        objectValue as GrpcBigDecimalArray
                    )
                case GrpcEvitaDataType.BIG_DECIMAL_NUMBER_RANGE:
                    return EvitaValueConverter.convertGrpcBigDecimalNumberRange(
                        objectValue as GrpcBigDecimalNumberRange
                    )
                case GrpcEvitaDataType.BIG_DECIMAL_NUMBER_RANGE_ARRAY:
                    return EvitaValueConverter.convertGrpcBigDecimalNumberRangeArray(
                        objectValue as GrpcBigDecimalNumberRangeArray
                    )
                case GrpcEvitaDataType.BOOLEAN_ARRAY:
                    return EvitaValueConverter.convertGrpcBooleanArray(
                        objectValue as GrpcBooleanArray
                    )
                case GrpcEvitaDataType.BYTE_ARRAY:
                    return EvitaValueConverter.convertGrpcIntegerArray(
                        objectValue as GrpcIntegerArray
                    )
                case GrpcEvitaDataType.BYTE_NUMBER_RANGE:
                    return EvitaValueConverter.convertGrpcByteNumberRange(
                        objectValue as GrpcIntegerNumberRange
                    )
                case GrpcEvitaDataType.LONG_ARRAY:
                    return EvitaValueConverter.convertGrpcLongArray(objectValue as GrpcLongArray)
                case GrpcEvitaDataType.LONG_NUMBER_RANGE_ARRAY:
                    return EvitaValueConverter.convertGrpcLongNumberRangeArray(
                        objectValue as GrpcLongNumberRangeArray
                    )
                case GrpcEvitaDataType.SHORT_NUMBER_RANGE:
                    return EvitaValueConverter.convertGrpcShortNumberRangeArray(
                        objectValue as GrpcIntegerNumberRangeArray
                    )
                case GrpcEvitaDataType.SHORT_ARRAY:
                    return EvitaValueConverter.convertGrpcShortNumberRange(
                        objectValue as GrpcIntegerNumberRange
                    )
                case GrpcEvitaDataType.LOCALE:
                    return EvitaValueConverter.convertGrpcLocale(objectValue as GrpcLocale)
                case GrpcEvitaDataType.CURRENCY:
                    return EvitaValueConverter.convertGrpcCurrency(objectValue as GrpcCurrency)
                case GrpcEvitaDataType.BYTE_NUMBER_RANGE_ARRAY:
                    return EvitaValueConverter.convertGrpcByteNumberRangeArray(
                        objectValue as GrpcIntegerNumberRangeArray
                    )
                case GrpcEvitaDataType.CHARACTER_ARRAY:
                    return EvitaValueConverter.convertGrpcIntegerArray(
                        objectValue as GrpcIntegerArray
                    )
                case GrpcEvitaDataType.CURRENCY_ARRAY:
                    return EvitaValueConverter.convertGrpcCurrencyArray(
                        objectValue as GrpcCurrencyArray
                    )
                case GrpcEvitaDataType.DATE_TIME_RANGE_ARRAY:
                    return EvitaValueConverter.convertGrpcDateTimeRangeArray(
                        objectValue as GrpcDateTimeRangeArray
                    )
                case GrpcEvitaDataType.INTEGER_ARRAY:
                    return EvitaValueConverter.convertGrpcIntegerArray(
                        objectValue as GrpcIntegerArray
                    )
                case GrpcEvitaDataType.INTEGER_NUMBER_RANGE:
                    return EvitaValueConverter.convertGrpcIntegerNumberRange(
                        objectValue as GrpcIntegerNumberRange
                    )
                case GrpcEvitaDataType.INTEGER_NUMBER_RANGE_ARRAY:
                    return EvitaValueConverter.convertGrpcIntegerNumberRangeArray(
                        objectValue as GrpcIntegerNumberRangeArray
                    )
                case GrpcEvitaDataType.PREDECESSOR:
                    return EvitaValueConverter.convertGrpcPredecessor(
                        objectValue as GrpcPredecessor
                    )
                case GrpcEvitaDataType.REFERENCED_ENTITY_PREDECESSOR:
                    return EvitaValueConverter.convertGrpcPredecessor(
                        objectValue as GrpcPredecessor
                    )
                case GrpcEvitaDataType.SHORT_NUMBER_RANGE_ARRAY:
                    return EvitaValueConverter.convertGrpcIntegerNumberRangeArray(
                        objectValue as GrpcIntegerNumberRangeArray
                    )
                case GrpcEvitaDataType.STRING_ARRAY:
                    return EvitaValueConverter.convertGrpcStringArray(
                        objectValue as GrpcStringArray
                    )
                case GrpcEvitaDataType.UUID:
                    return EvitaValueConverter.convertGrpcUuid(objectValue as GrpcUuid)
                case GrpcEvitaDataType.UUID_ARRAY:
                    return EvitaValueConverter.convertGrpcUuidArray(objectValue as GrpcUuidArray)
                case GrpcEvitaDataType.OFFSET_DATE_TIME_ARRAY:
                    return EvitaValueConverter.convertGrpcOffsetDateTimeArray(
                        objectValue as GrpcOffsetDateTimeArray
                    )
                case GrpcEvitaDataType.DATE_TIME_RANGE:
                    return EvitaValueConverter.convertGrpcDateTimeRange(
                        objectValue as GrpcDateTimeRange
                    )
                case GrpcEvitaDataType.LOCALE_ARRAY:
                    return EvitaValueConverter.convertGrpcLocaleArray(
                        objectValue as GrpcLocaleArray
                    )
                case GrpcEvitaDataType.LOCAL_DATE:
                    return EvitaValueConverter.convertGrpcLocalDate(
                        objectValue as GrpcOffsetDateTime
                    )
                case GrpcEvitaDataType.LOCAL_DATE_ARRAY:
                    return EvitaValueConverter.convertGrpcLocalDateArray(
                        objectValue as GrpcOffsetDateTimeArray
                    )
                case GrpcEvitaDataType.LOCAL_DATE_TIME:
                    return EvitaValueConverter.convertGrpcLocalDateTime(
                        objectValue as GrpcOffsetDateTime
                    )
                case GrpcEvitaDataType.LOCAL_DATE_TIME_ARRAY:
                    return EvitaValueConverter.convertGrpcLocalDateTimeArray(
                        objectValue as GrpcOffsetDateTimeArray
                    )
                case GrpcEvitaDataType.LOCAL_TIME:
                    return EvitaValueConverter.convertGrpcLocalTime(
                        objectValue as GrpcOffsetDateTime
                    )
                case GrpcEvitaDataType.LOCAL_TIME_ARRAY:
                    return EvitaValueConverter.convertGrpcLocalTimeArray(
                        objectValue as GrpcOffsetDateTimeArray
                    )
                case GrpcEvitaDataType.LONG_NUMBER_RANGE:
                    return EvitaValueConverter.convertGrpcLongNumberRange(
                        objectValue as GrpcLongNumberRange
                    )
                case GrpcEvitaDataType.OFFSET_DATE_TIME:
                    return EvitaValueConverter.convertGrpcOffsetDateTime(
                        objectValue as GrpcOffsetDateTime
                    )
                default:
                    throw new UnexpectedError(`Unsupported evita data type '${val.type}'.`)
            }
        }
    }

    /**
     * Projects a single leaf of a complex data object tree into a JSON-compatible value. No `bigint`s and no
     * `data-type/` wrappers may leak into the result because complex data objects are rendered by a bare
     * `JSON.stringify` in several places.
     */
    private static convertGrpcDataItemLeaf(value: GrpcEvitaValue): EvitaValue {
        if (value.value.case === undefined) {
            // a null property of a complex data object is sent as an empty value message
            return null
        }
        const objectValue = value.value.value
        switch (value.type) {
            case GrpcEvitaDataType.BYTE:
            case GrpcEvitaDataType.SHORT:
            case GrpcEvitaDataType.INTEGER:
            case GrpcEvitaDataType.BOOLEAN:
            case GrpcEvitaDataType.STRING:
            case GrpcEvitaDataType.CHARACTER:
                return objectValue
            case GrpcEvitaDataType.LONG:
                // longs are projected as strings, ECMAScript numbers cannot hold the entire long range
                return String(objectValue)
            case GrpcEvitaDataType.BIG_DECIMAL:
                return (objectValue as GrpcBigDecimal).valueString
            case GrpcEvitaDataType.LOCALE:
                return (objectValue as GrpcLocale).languageTag
            case GrpcEvitaDataType.CURRENCY:
                return EvitaValueConverter.quoteDataItemValue((objectValue as GrpcCurrency).code)
            case GrpcEvitaDataType.UUID:
                return EvitaValueConverter.quoteDataItemValue(
                    EvitaValueConverter.convertGrpcUuid(objectValue as GrpcUuid).toString()
                )
            case GrpcEvitaDataType.PREDECESSOR:
            case GrpcEvitaDataType.REFERENCED_ENTITY_PREDECESSOR:
                return EvitaValueConverter.convertGrpcPredecessor(objectValue as GrpcPredecessor).toString()
            case GrpcEvitaDataType.OFFSET_DATE_TIME:
                return EvitaValueConverter.formatDataItemOffsetDateTime(objectValue as GrpcOffsetDateTime)
            case GrpcEvitaDataType.LOCAL_DATE_TIME:
                return EvitaValueConverter.formatDataItemLocalDateTime(objectValue as GrpcOffsetDateTime)
            case GrpcEvitaDataType.LOCAL_DATE:
                return EvitaValueConverter.formatDataItemLocalDate(objectValue as GrpcOffsetDateTime)
            case GrpcEvitaDataType.LOCAL_TIME:
                return EvitaValueConverter.formatDataItemLocalTime(objectValue as GrpcOffsetDateTime)
            case GrpcEvitaDataType.DATE_TIME_RANGE:
                return EvitaValueConverter.formatDataItemDateTimeRange(objectValue as GrpcDateTimeRange)
            case GrpcEvitaDataType.BIG_DECIMAL_NUMBER_RANGE:
                return EvitaValueConverter.formatDataItemBigDecimalNumberRange(
                    objectValue as GrpcBigDecimalNumberRange
                )
            case GrpcEvitaDataType.LONG_NUMBER_RANGE:
                return EvitaValueConverter.formatDataItemNumberRange(
                    (objectValue as GrpcLongNumberRange).from,
                    (objectValue as GrpcLongNumberRange).to
                )
            case GrpcEvitaDataType.INTEGER_NUMBER_RANGE:
            case GrpcEvitaDataType.SHORT_NUMBER_RANGE:
            case GrpcEvitaDataType.BYTE_NUMBER_RANGE:
                return EvitaValueConverter.formatDataItemNumberRange(
                    (objectValue as GrpcIntegerNumberRange).from,
                    (objectValue as GrpcIntegerNumberRange).to
                )
            // evitaDB models arrays as `GrpcDataItemArray`, array leaves are handled only defensively so that
            // no immutable list ever escapes into the converted tree
            case GrpcEvitaDataType.STRING_ARRAY:
                return [...(objectValue as GrpcStringArray).value]
            case GrpcEvitaDataType.BOOLEAN_ARRAY:
                return [...(objectValue as GrpcBooleanArray).value]
            case GrpcEvitaDataType.BYTE_ARRAY:
            case GrpcEvitaDataType.SHORT_ARRAY:
            case GrpcEvitaDataType.INTEGER_ARRAY:
            case GrpcEvitaDataType.CHARACTER_ARRAY:
                return [...(objectValue as GrpcIntegerArray).value]
            case GrpcEvitaDataType.LONG_ARRAY:
                return (objectValue as GrpcLongArray).value.map(it => String(it))
            case GrpcEvitaDataType.BIG_DECIMAL_ARRAY:
                return (objectValue as GrpcBigDecimalArray).value.map(it => it.valueString)
            case GrpcEvitaDataType.LOCALE_ARRAY:
                return (objectValue as GrpcLocaleArray).value.map(it => it.languageTag)
            case GrpcEvitaDataType.CURRENCY_ARRAY:
                return (objectValue as GrpcCurrencyArray).value
                    .map(it => EvitaValueConverter.quoteDataItemValue(it.code))
            case GrpcEvitaDataType.UUID_ARRAY:
                return (objectValue as GrpcUuidArray).value
                    .map(it => EvitaValueConverter.quoteDataItemValue(
                        EvitaValueConverter.convertGrpcUuid(it).toString()
                    ))
            case GrpcEvitaDataType.OFFSET_DATE_TIME_ARRAY:
                return (objectValue as GrpcOffsetDateTimeArray).value
                    .map(it => EvitaValueConverter.formatDataItemOffsetDateTime(it))
            case GrpcEvitaDataType.LOCAL_DATE_TIME_ARRAY:
                return (objectValue as GrpcOffsetDateTimeArray).value
                    .map(it => EvitaValueConverter.formatDataItemLocalDateTime(it))
            case GrpcEvitaDataType.LOCAL_DATE_ARRAY:
                return (objectValue as GrpcOffsetDateTimeArray).value
                    .map(it => EvitaValueConverter.formatDataItemLocalDate(it))
            case GrpcEvitaDataType.LOCAL_TIME_ARRAY:
                return (objectValue as GrpcOffsetDateTimeArray).value
                    .map(it => EvitaValueConverter.formatDataItemLocalTime(it))
            case GrpcEvitaDataType.DATE_TIME_RANGE_ARRAY:
                return (objectValue as GrpcDateTimeRangeArray).value
                    .map(it => EvitaValueConverter.formatDataItemDateTimeRange(it))
            case GrpcEvitaDataType.BIG_DECIMAL_NUMBER_RANGE_ARRAY:
                return (objectValue as GrpcBigDecimalNumberRangeArray).value
                    .map(it => EvitaValueConverter.formatDataItemBigDecimalNumberRange(it))
            case GrpcEvitaDataType.LONG_NUMBER_RANGE_ARRAY:
                return (objectValue as GrpcLongNumberRangeArray).value
                    .map(it => EvitaValueConverter.formatDataItemNumberRange(it.from, it.to))
            case GrpcEvitaDataType.INTEGER_NUMBER_RANGE_ARRAY:
            case GrpcEvitaDataType.SHORT_NUMBER_RANGE_ARRAY:
            case GrpcEvitaDataType.BYTE_NUMBER_RANGE_ARRAY:
                return (objectValue as GrpcIntegerNumberRangeArray).value
                    .map(it => EvitaValueConverter.formatDataItemNumberRange(it.from, it.to))
            default:
                throw new UnexpectedError(`Unsupported evita data type '${value.type}'.`)
        }
    }

    /**
     * evitaDB formats currencies, UUIDs and similar values wrapped in apostrophes when they are serialized into
     * a complex data object.
     */
    private static quoteDataItemValue(value: string): string {
        return `'${value}'`
    }

    private static formatDataItemOffsetDateTime(value: GrpcOffsetDateTime): string {
        return EvitaValueConverter.stripRedundantFractionZeros(
            EvitaValueConverter.toDataItemDateTime(value)
                .toISO({ suppressSeconds: true, suppressMilliseconds: true, includeOffset: true })!
        )
    }

    private static formatDataItemLocalDateTime(value: GrpcOffsetDateTime): string {
        return EvitaValueConverter.stripRedundantFractionZeros(
            EvitaValueConverter.toDataItemDateTime(value)
                .toISO({ suppressSeconds: true, suppressMilliseconds: true, includeOffset: false })!
        )
    }

    private static formatDataItemLocalDate(value: GrpcOffsetDateTime): string {
        return EvitaValueConverter.toDataItemDateTime(value).toISODate()!
    }

    private static formatDataItemLocalTime(value: GrpcOffsetDateTime): string {
        return EvitaValueConverter.stripRedundantFractionZeros(
            EvitaValueConverter.toDataItemDateTime(value)
                .toISOTime({ suppressSeconds: true, suppressMilliseconds: true, includeOffset: false })!
        )
    }

    /**
     * evitaDB prints the second fraction with the minimum number of digits (`.1`), whereas Luxon always prints
     * all three (`.100`).
     */
    private static stripRedundantFractionZeros(dateTime: string): string {
        return dateTime.replace(/(\.\d*[1-9])0+/, '$1')
    }

    private static formatDataItemDateTimeRange(value: GrpcDateTimeRange): string {
        return EvitaValueConverter.formatDataItemRange(
            value.from != undefined ? EvitaValueConverter.formatDataItemOffsetDateTime(value.from) : undefined,
            value.to != undefined ? EvitaValueConverter.formatDataItemOffsetDateTime(value.to) : undefined
        )
    }

    private static formatDataItemBigDecimalNumberRange(value: GrpcBigDecimalNumberRange): string {
        return EvitaValueConverter.formatDataItemRange(value.from?.valueString, value.to?.valueString)
    }

    private static formatDataItemNumberRange(
        from: number | bigint | undefined,
        to: number | bigint | undefined
    ): string {
        return EvitaValueConverter.formatDataItemRange(
            from != undefined ? String(from) : undefined,
            to != undefined ? String(to) : undefined
        )
    }

    private static formatDataItemRange(from: string | undefined, to: string | undefined): string {
        return `[${from ?? ''},${to ?? ''}]`
    }

    /**
     * Reconstructs the date-time in the offset it was sent with. The offset is decisive - local date/time values are
     * always sent in the UTC offset, so reading them in the local system time zone would shift them.
     */
    private static toDataItemDateTime(value: GrpcOffsetDateTime): DateTime {
        if (value.timestamp == undefined) {
            throw new UnexpectedError('Missing prop timestamp')
        }
        const milliseconds: number = Number(value.timestamp.seconds) * 1000 +
            Math.floor(value.timestamp.nanos / 1_000_000)
        return DateTime.fromMillis(milliseconds, { zone: toLuxonZone(value.offset) })
    }

    static convertGrpcBigDecimal(value: GrpcBigDecimal): BigDecimal {
        return new BigDecimal(value.valueString)
    }

    static convertGrpcDateTimeRange(value: GrpcDateTimeRange): DateTimeRange {
        if (!EvitaValueConverter.checkGrpcDateTimeValidity(value.from, value.to, false))
            throw new Error('DateTimeRange has undefined prop from and to')
        else
            return new DateTimeRange(
                value.from != undefined
                    ? EvitaValueConverter.convertGrpcOffsetDateTime(value.from!)
                    : undefined,
                value.to != undefined
                    ? EvitaValueConverter.convertGrpcOffsetDateTime(value.to!)
                    : undefined
            )
    }

    static convertGrpcBigDecimalNumberRange(
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

    static convertGrpcLongNumberRange(value: GrpcLongNumberRange): Range<bigint> {
        if (EvitaValueConverter.checkNumberRangeValidity(value.from, value.to))
            throw new Error('LongRangeNumber has undefined prop from and to')
        return new BigintNumberRange(value.from, value.to)
    }

    static convertGrpcIntegerNumberRange(
        value: GrpcIntegerNumberRange
    ): Range<number> {
        if (EvitaValueConverter.checkNumberRangeValidity(value.from, value.to))
            throw new Error('IntegerRangeNumber has undefined prop from and to')
        return new IntegerRange(value.from, value.to)
    }

    static convertGrpcShortNumberRange(
        value: GrpcIntegerNumberRange
    ): Range<number> {
        if (EvitaValueConverter.checkNumberRangeValidity(value.from, value.to))
            throw new Error('ShortRangeNumber has undefined prop from and to')
        return new IntegerRange(value.from, value.to)
    }

    static convertGrpcByteNumberRange(
        value: GrpcIntegerNumberRange
    ): Range<number> {
        if (EvitaValueConverter.checkNumberRangeValidity(value.from, value.to))
            throw new Error('ByteRangeNumber has undefined prop from and to')
        return new IntegerRange(value.from, value.to)
    }

    static convertGrpcLocale(value: GrpcLocale): Locale {
        return new Locale(value.languageTag)
    }

    static convertGrpcCurrency(value: GrpcCurrency): Currency {
        return new Currency(value.code)
    }

    static convertGrpcUuid(grpcUuid: GrpcUuid): Uuid {
        return Uuid.fromBits(BigInt(grpcUuid.mostSignificantBits), BigInt(grpcUuid.leastSignificantBits))
    }

    static convertUuid(uuid: Uuid): GrpcUuid {
        return {
            mostSignificantBits: uuid.mostSignificantBits.toString(),
            leastSignificantBits: uuid.leastSignificantBits.toString()
        } as GrpcUuid
    }

    static convertGrpcPredecessor(value: GrpcPredecessor): Predecessor {
        return new Predecessor(
            value.head,
            value.head ? -1 : value.predecessorId
        )
    }

    static convertGrpcStringArray(value: GrpcStringArray): ImmutableList<string> {
        return ImmutableList(value.value)
    }

    static convertGrpcIntegerArray(
        value: GrpcIntegerArray
    ): ImmutableList<number> {
        return ImmutableList(value.value)
    }

    static convertGrpcLongArray(value: GrpcLongArray): ImmutableList<bigint> {
        return ImmutableList(value.value.map(BigInt))
    }

    static convertGrpcBooleanArray(
        value: GrpcBooleanArray
    ): ImmutableList<boolean> {
        return ImmutableList(value.value)
    }

    static convertGrpcBigDecimalArray(
        value: GrpcBigDecimalArray
    ): ImmutableList<BigDecimal> {
        const newBigDecimalArray: BigDecimal[] = []
        for (const grpcDecimal of value.value) {
            newBigDecimalArray.push(new BigDecimal(grpcDecimal.valueString))
        }

        return ImmutableList(newBigDecimalArray)
    }

    static convertGrpcOffsetDateTimeArray(
        value: GrpcOffsetDateTimeArray
    ): ImmutableList<OffsetDateTime> {
        const offsetDateTimeArray: OffsetDateTime[] = []
        for (const grpcDateTime of value.value) {
            offsetDateTimeArray.push(EvitaValueConverter.convertGrpcOffsetDateTime(grpcDateTime))
        }
        return ImmutableList(offsetDateTimeArray)
    }

    static convertGrpcLocalDateTimeArray(
        value: GrpcOffsetDateTimeArray
    ): ImmutableList<LocalDateTime> {
        const localeDateTimeArray: LocalDateTime[] = []
        for (const grpcDateTime of value.value) {
            localeDateTimeArray.push(EvitaValueConverter.convertGrpcLocalDateTime(grpcDateTime))
        }
        return ImmutableList(localeDateTimeArray)
    }

    static convertGrpcLocalDateArray(
        value: GrpcOffsetDateTimeArray
    ): ImmutableList<LocalDate> {
        const localDateArray: LocalDate[] = []
        for (const localDate of value.value) {
            localDateArray.push(EvitaValueConverter.convertGrpcLocalDate(localDate))
        }
        return ImmutableList(localDateArray)
    }

    static convertGrpcLocalTimeArray(
        value: GrpcOffsetDateTimeArray
    ): ImmutableList<LocalTime> {
        const localTimeArray: LocalTime[] = []
        for (const localTime of value.value) {
            localTimeArray.push(EvitaValueConverter.convertGrpcLocalTime(localTime))
        }
        return ImmutableList(localTimeArray)
    }

    static convertGrpcDateTimeRangeArray(
        value: GrpcDateTimeRangeArray
    ): ImmutableList<DateTimeRange> {
        const dateTimeRange: DateTimeRange[] = []
        for (const grpcDateTimeRange of value.value) {
            if (
                EvitaValueConverter.checkGrpcDateTimeValidity(
                    grpcDateTimeRange.from,
                    grpcDateTimeRange.to,
                    false
                )
            ) {
                dateTimeRange.push(
                    new DateTimeRange(
                        grpcDateTimeRange.from != undefined
                            ? EvitaValueConverter.convertGrpcOffsetDateTime(grpcDateTimeRange.from!)
                            : undefined,
                        grpcDateTimeRange.to != undefined
                            ? EvitaValueConverter.convertGrpcOffsetDateTime(grpcDateTimeRange.to!)
                            : undefined
                    )
                )
            }
        }
        return ImmutableList(dateTimeRange)
    }

    static convertGrpcBigDecimalNumberRangeArray(
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

    static convertGrpcLongNumberRangeArray(
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

    static convertGrpcIntegerNumberRangeArray(
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

    static convertGrpcShortNumberRangeArray(
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

    static convertGrpcByteNumberRangeArray(
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

    static convertGrpcLocaleArray(value: GrpcLocaleArray): ImmutableList<Locale> {
        const localeArray: Locale[] = []
        for (const locale of value.value) {
            localeArray.push(new Locale(locale.languageTag))
        }
        return ImmutableList(localeArray)
    }

    static convertGrpcCurrencyArray(
        value: GrpcCurrencyArray
    ): ImmutableList<Currency> {
        const currencyArray: Currency[] = []
        for (const currency of value.value) {
            currencyArray.push(new Currency(currency.code))
        }
        return ImmutableList(currencyArray)
    }

    static convertGrpcUuidArray(grpcUuids: GrpcUuidArray): ImmutableList<Uuid> {
        const uuids: Uuid[] = []
        for (const grpcUuid of grpcUuids.value) {
            uuids.push(EvitaValueConverter.convertGrpcUuid(grpcUuid))
        }
        return ImmutableList(uuids)
    }

    static convertGrpcLocalDate(offsetDateTime: GrpcOffsetDateTime): LocalDate {
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

    static convertGrpcLocalDateTime(offsetDateTime: GrpcOffsetDateTime): LocalDateTime {
        if (!offsetDateTime.timestamp) {
            throw new Error('Missing prop timestamp')
        }
        return new LocalDateTime(
            DateTime.fromSeconds(
                Number(offsetDateTime.timestamp.seconds)
            ).toISO()
        )
    }

    static convertGrpcOffsetDateTime(
        offsetDateTime: GrpcOffsetDateTime
    ): OffsetDateTime {
        if (!offsetDateTime.timestamp) {
            throw new Error('Missing prop timestamp')
        }
        return new OffsetDateTime(
            EvitaValueConverter.convertGrpcTimestamp(offsetDateTime.timestamp),
            offsetDateTime.offset
        )
    }

    static convertOffsetDateTime(offsetDateTime: OffsetDateTime): GrpcOffsetDateTime {
        return {
            timestamp: {
                nanos: offsetDateTime.timestamp.nanos,
                seconds: offsetDateTime.timestamp.seconds
            },
            offset: offsetDateTime.offset

        } as GrpcOffsetDateTime
    }

    static convertGrpcLocalTime(grpcTime: GrpcOffsetDateTime): LocalTime {
        if (!grpcTime.timestamp) {
            throw new Error('Missing prop timestamp')
        }
        const localTime: LocalTime = new LocalTime(
            DateTime.fromSeconds(Number(grpcTime.timestamp.seconds)).toISOTime()
        )
        return localTime
    }

    private static convertGrpcTimestamp(grpcTimestamp: GrpcTimestamp): Timestamp {
        return new Timestamp(
            grpcTimestamp.seconds,
            grpcTimestamp.nanos
        )
    }

    private static checkGrpcDateTimeValidity(
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

    private static checkNumberRangeValidity(
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
