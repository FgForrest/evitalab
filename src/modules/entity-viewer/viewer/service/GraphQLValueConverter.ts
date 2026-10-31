import { List as ImmutableList } from 'immutable'
import { DateTime } from 'luxon'
import type { EvitaValue } from '@/modules/database-driver/data-type/EvitaValue'
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
import { OffsetDateTime, Timestamp } from '@/modules/database-driver/data-type/OffsetDateTime'
import { Predecessor } from '@/modules/database-driver/data-type/Predecessor'
import { PriceInnerRecordHandling } from '@/modules/database-driver/data-type/PriceInnerRecordHandling'
import { Uuid } from '@/modules/database-driver/data-type/Uuid'
import { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import type { GraphQLResultNode } from '@/modules/database-driver/connector/gql/model/GraphQLResultNode'
import { EntityPrice } from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityPrice'

/**
 * Converts a single non-null GraphQL wire value of one scalar into the driver's data type.
 */
export type GraphQLScalarValueConverter = (raw: EvitaValue) => EvitaValue

/**
 * Converter of every {@link Scalar}: a new scalar does not compile until it gets a converter.
 */
export type GraphQLScalarValueConverterTable = { readonly [S in Scalar]: GraphQLScalarValueConverter }

/**
 * Trailing ISO offset of an `ISO_OFFSET_DATE_TIME` text, kept verbatim so that it equals the offset id the gRPC API
 * sends (`Z` for UTC, not `+00:00`).
 */
const isoOffsetPattern: RegExp = /(Z|[+-]\d{2}:\d{2}(?::\d{2})?)$/

const identity: GraphQLScalarValueConverter = raw => raw

function convertOffsetDateTime(raw: string): OffsetDateTime {
    const offset: string | undefined = isoOffsetPattern.exec(raw)?.[1]
    const dateTime: DateTime = DateTime.fromISO(raw, { setZone: true })
    if (offset == undefined || !dateTime.isValid) {
        throw new UnexpectedError(`Invalid GraphQL offset date time '${raw}'.`)
    }
    return new OffsetDateTime(Timestamp.fromDate(dateTime.toJSDate()), offset)
}

function convertPredecessor(raw: number): Predecessor {
    // the head of the list is sent as `-1`, the gRPC converter keeps the same sentinel
    return new Predecessor(raw === -1, raw)
}

/**
 * Converts a `[from, to]` range tuple, `null` being an open end.
 */
function rangeConverter<E>(createRange: (from: E | undefined, to: E | undefined) => EvitaValue,
                           convertEnd: (end: EvitaValue) => E): GraphQLScalarValueConverter {
    return (raw: [EvitaValue, EvitaValue]) => createRange(
        raw[0] != undefined ? convertEnd(raw[0]) : undefined,
        raw[1] != undefined ? convertEnd(raw[1]) : undefined
    )
}

/**
 * Converts an array item by item into an immutable list, the driver's array representation on the gRPC path.
 */
function arrayConverter(convertItem: GraphQLScalarValueConverter): GraphQLScalarValueConverter {
    return (raw: EvitaValue[]) => ImmutableList(raw.map(item => item == undefined ? item : convertItem(item)))
}

const convertLong: GraphQLScalarValueConverter = raw => BigInt(raw)
const convertBigDecimal: GraphQLScalarValueConverter = raw => new BigDecimal(String(raw))
const convertLocalDateTime: GraphQLScalarValueConverter = raw => new LocalDateTime(raw)
const convertLocalDate: GraphQLScalarValueConverter = raw => new LocalDate(raw)
const convertLocalTime: GraphQLScalarValueConverter = raw => new LocalTime(raw)
const convertDateTimeRange: GraphQLScalarValueConverter = rangeConverter<OffsetDateTime>(
    (from, to) => new DateTimeRange(from, to),
    convertOffsetDateTime
)
const convertBigDecimalNumberRange: GraphQLScalarValueConverter = rangeConverter<BigDecimal>(
    (from, to) => new BigDecimalNumberRange(from, to),
    convertBigDecimal
)
const convertIntegerNumberRange: GraphQLScalarValueConverter = rangeConverter<number>(
    (from, to) => new IntegerRange(from, to),
    end => Number(end)
)
const convertLongNumberRange: GraphQLScalarValueConverter = rangeConverter<bigint>(
    (from, to) => new BigintNumberRange(from, to),
    end => BigInt(end)
)
const convertLocale: GraphQLScalarValueConverter = raw => new Locale(raw)
const convertCurrency: GraphQLScalarValueConverter = raw => new Currency(raw)
const convertUuid: GraphQLScalarValueConverter = raw => Uuid.fromCode(raw)

/**
 * Converters of the wire shapes of evitaDB's GraphQL scalar coercings (`dataType/coercing/` of the GraphQL API):
 * `Long` and `BigDecimal` as strings, date-times as ISO texts truncated to milliseconds (`OffsetDateTime` with its
 * offset), ranges as `[from, to]` tuples, predecessors as their primary key and complex data as plain JSON.
 */
export const graphQLScalarValueConverters: GraphQLScalarValueConverterTable = {
    [Scalar.String]: identity,
    [Scalar.StringArray]: arrayConverter(identity),
    [Scalar.Byte]: identity,
    [Scalar.ByteArray]: arrayConverter(identity),
    [Scalar.Short]: identity,
    [Scalar.ShortArray]: arrayConverter(identity),
    [Scalar.Integer]: identity,
    [Scalar.IntegerArray]: arrayConverter(identity),
    [Scalar.Long]: convertLong,
    [Scalar.LongArray]: arrayConverter(convertLong),
    [Scalar.Boolean]: identity,
    [Scalar.BooleanArray]: arrayConverter(identity),
    [Scalar.Character]: identity,
    [Scalar.CharacterArray]: arrayConverter(identity),
    [Scalar.BigDecimal]: convertBigDecimal,
    [Scalar.BigDecimalArray]: arrayConverter(convertBigDecimal),
    [Scalar.OffsetDateTime]: convertOffsetDateTime,
    [Scalar.OffsetDateTimeArray]: arrayConverter(convertOffsetDateTime),
    [Scalar.LocalDateTime]: convertLocalDateTime,
    [Scalar.LocalDateTimeArray]: arrayConverter(convertLocalDateTime),
    [Scalar.LocalDate]: convertLocalDate,
    [Scalar.LocalDateArray]: arrayConverter(convertLocalDate),
    [Scalar.LocalTime]: convertLocalTime,
    [Scalar.LocalTimeArray]: arrayConverter(convertLocalTime),
    [Scalar.DateTimeRange]: convertDateTimeRange,
    [Scalar.DateTimeRangeArray]: arrayConverter(convertDateTimeRange),
    [Scalar.BigDecimalNumberRange]: convertBigDecimalNumberRange,
    [Scalar.BigDecimalNumberRangeArray]: arrayConverter(convertBigDecimalNumberRange),
    [Scalar.ByteNumberRange]: convertIntegerNumberRange,
    [Scalar.ByteNumberRangeArray]: arrayConverter(convertIntegerNumberRange),
    [Scalar.ShortNumberRange]: convertIntegerNumberRange,
    [Scalar.ShortNumberRangeArray]: arrayConverter(convertIntegerNumberRange),
    [Scalar.IntegerNumberRange]: convertIntegerNumberRange,
    [Scalar.IntegerNumberRangeArray]: arrayConverter(convertIntegerNumberRange),
    [Scalar.LongNumberRange]: convertLongNumberRange,
    [Scalar.LongNumberRangeArray]: arrayConverter(convertLongNumberRange),
    [Scalar.Locale]: convertLocale,
    [Scalar.LocaleArray]: arrayConverter(convertLocale),
    [Scalar.Currency]: convertCurrency,
    [Scalar.CurrencyArray]: arrayConverter(convertCurrency),
    [Scalar.UUID]: convertUuid,
    [Scalar.UUIDArray]: arrayConverter(convertUuid),
    [Scalar.Predecessor]: convertPredecessor,
    [Scalar.ReferencedEntityPredecessor]: convertPredecessor,
    [Scalar.ComplexDataObject]: identity
}

/**
 * Converts values of a GraphQL query response into the driver's data types, so that the entity viewer holds the
 * same model values for both query languages (see `EvitaValueConverter` for the gRPC path).
 */
export class GraphQLValueConverter {

    /**
     * Converts a wire value of the given scalar. `null`/`undefined` and values of an unknown scalar are returned as
     * they are.
     */
    static convertValue(raw: EvitaValue,
                        scalar: Scalar | undefined,
                        converters: GraphQLScalarValueConverterTable = graphQLScalarValueConverters): EvitaValue {
        if (raw == undefined || scalar == undefined) {
            return raw
        }
        return converters[scalar](raw)
    }

    /**
     * Converts the entity's `locales`, which GraphQL sends as values of the catalog's locale enum: language tags with
     * `_` in place of `-` (`cs_CZ`).
     */
    static convertLocaleEnumArray(raw: EvitaValue): ImmutableList<Locale> | undefined {
        if (raw == undefined) {
            return undefined
        }
        return ImmutableList((raw as string[]).map(it => new Locale(it.replace(/_/g, '-'))))
    }

    /**
     * Converts the entity's `scope` (`LIVE`, `ARCHIVED`); a missing value is returned as `undefined`, an unknown one
     * stays raw so that it remains visible.
     */
    static convertEntityScope(raw: EvitaValue): EntityScope | EvitaValue | undefined {
        switch (raw) {
            case 'LIVE':
                return EntityScope.Live
            case 'ARCHIVED':
                return EntityScope.Archive
            default:
                return raw ?? undefined
        }
    }

    /**
     * Converts the entity's price inner record handling into the driver's enum, the value the gRPC path stores.
     */
    static convertPriceInnerRecordHandling(raw: EvitaValue): PriceInnerRecordHandling | undefined {
        switch (raw) {
            case undefined:
            case null:
                return undefined
            case 'NONE':
                return PriceInnerRecordHandling.None
            case 'LOWEST_PRICE':
                return PriceInnerRecordHandling.LowestPrice
            case 'SUM':
                return PriceInnerRecordHandling.Sum
            default:
                return PriceInnerRecordHandling.Unknown
        }
    }

    /**
     * Converts a price selected with the fields of the entity viewer's GraphQL price template (`priceForSale` or an
     * item of `prices`) into the same model value the gRPC path builds.
     */
    static convertPrice(raw: GraphQLResultNode): EntityPrice {
        return new EntityPrice(
            raw.priceId,
            raw.priceList,
            GraphQLValueConverter.convertValue(raw.currency, Scalar.Currency),
            raw.innerRecordId ?? undefined,
            raw.indexed,
            GraphQLValueConverter.convertValue(raw.validity, Scalar.DateTimeRange) ?? undefined,
            GraphQLValueConverter.convertValue(raw.priceWithoutTax, Scalar.BigDecimal),
            GraphQLValueConverter.convertValue(raw.priceWithTax, Scalar.BigDecimal),
            GraphQLValueConverter.convertValue(raw.taxRate, Scalar.BigDecimal)
        )
    }
}
