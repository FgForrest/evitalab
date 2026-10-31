import { describe, expect, test } from 'vitest'
import { create } from '@bufbuild/protobuf'
import type { MessageInitShape } from '@bufbuild/protobuf'
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
import { PriceInnerRecordHandling } from '@/modules/database-driver/data-type/PriceInnerRecordHandling'
import { Uuid } from '@/modules/database-driver/data-type/Uuid'
import { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope'
import { EvitaValueConverter } from '@/modules/database-driver/connector/grpc/service/converter/EvitaValueConverter'
import { EntityConverter } from '@/modules/database-driver/connector/grpc/service/converter/EntityConverter'
import { GrpcEvitaValueSchema } from '@/modules/database-driver/connector/grpc/gen/GrpcEvitaDataTypes_pb'
import {
    GrpcEntityScope,
    GrpcEvitaDataType,
    GrpcPriceInnerRecordHandling
} from '@/modules/database-driver/connector/grpc/gen/GrpcEnums_pb'
import { GraphQLValueConverter } from '@/modules/entity-viewer/viewer/service/GraphQLValueConverter'
import { Price } from '@/modules/database-driver/request-response/data/Price'
import { EntityPrice } from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityPrice'

// 2024-07-01T00:00:00Z
const summerInstant: bigint = 1719792000n
const uuidCode: string = '123e4567-e89b-12d3-a456-426614174000'

/**
 * Wire value and expected model value of every scalar; a new scalar does not compile until it gets a sample.
 */
const samples: Readonly<Record<Scalar, readonly [unknown, unknown]>> = {
    [Scalar.String]: ['code', 'code'],
    [Scalar.StringArray]: [['a', 'b'], ImmutableList(['a', 'b'])],
    [Scalar.Byte]: [1, 1],
    [Scalar.ByteArray]: [[1, 2], ImmutableList([1, 2])],
    [Scalar.Short]: [300, 300],
    [Scalar.ShortArray]: [[300], ImmutableList([300])],
    [Scalar.Integer]: [42, 42],
    [Scalar.IntegerArray]: [[42], ImmutableList([42])],
    [Scalar.Long]: ['9007199254740993', 9007199254740993n],
    [Scalar.LongArray]: [['1', '2'], ImmutableList([1n, 2n])],
    [Scalar.Boolean]: [true, true],
    [Scalar.BooleanArray]: [[true, false], ImmutableList([true, false])],
    [Scalar.Character]: ['c', 'c'],
    [Scalar.CharacterArray]: [['c'], ImmutableList(['c'])],
    [Scalar.BigDecimal]: ['10.50', new BigDecimal('10.50')],
    [Scalar.BigDecimalArray]: [['1.5'], ImmutableList([new BigDecimal('1.5')])],
    [Scalar.OffsetDateTime]: ['2024-07-01T02:00:00+02:00', OffsetDateTime.of(summerInstant, 0, '+02:00')],
    [Scalar.OffsetDateTimeArray]: [['2024-07-01T00:00:00Z'], ImmutableList([OffsetDateTime.of(summerInstant, 0, 'Z')])],
    [Scalar.LocalDateTime]: ['2024-07-01T10:15:30', new LocalDateTime('2024-07-01T10:15:30')],
    [Scalar.LocalDateTimeArray]: [['2024-07-01T10:15:30'], ImmutableList([new LocalDateTime('2024-07-01T10:15:30')])],
    [Scalar.LocalDate]: ['2024-07-01', new LocalDate('2024-07-01')],
    [Scalar.LocalDateArray]: [['2024-07-01'], ImmutableList([new LocalDate('2024-07-01')])],
    [Scalar.LocalTime]: ['10:15:30', new LocalTime('10:15:30')],
    [Scalar.LocalTimeArray]: [['10:15:30'], ImmutableList([new LocalTime('10:15:30')])],
    [Scalar.DateTimeRange]: [['2024-07-01T00:00:00Z', null], DateTimeRange.since(OffsetDateTime.of(summerInstant, 0, 'Z'))],
    [Scalar.DateTimeRangeArray]: [[[null, '2024-07-01T00:00:00Z']], ImmutableList([DateTimeRange.until(OffsetDateTime.of(summerInstant, 0, 'Z'))])],
    [Scalar.BigDecimalNumberRange]: [['1.5', null], new BigDecimalNumberRange(new BigDecimal('1.5'), undefined)],
    [Scalar.BigDecimalNumberRangeArray]: [[['1', '2']], ImmutableList([new BigDecimalNumberRange(new BigDecimal('1'), new BigDecimal('2'))])],
    [Scalar.ByteNumberRange]: [[0, 5], new IntegerRange(0, 5)],
    [Scalar.ByteNumberRangeArray]: [[[0, 5]], ImmutableList([new IntegerRange(0, 5)])],
    [Scalar.ShortNumberRange]: [[null, 5], new IntegerRange(undefined, 5)],
    [Scalar.ShortNumberRangeArray]: [[[1, null]], ImmutableList([new IntegerRange(1, undefined)])],
    [Scalar.IntegerNumberRange]: [[1, 5], new IntegerRange(1, 5)],
    [Scalar.IntegerNumberRangeArray]: [[[1, 5]], ImmutableList([new IntegerRange(1, 5)])],
    [Scalar.LongNumberRange]: [['1', '9007199254740993'], new BigintNumberRange(1n, 9007199254740993n)],
    [Scalar.LongNumberRangeArray]: [[['1', null]], ImmutableList([new BigintNumberRange(1n, undefined)])],
    [Scalar.Locale]: ['cs-CZ', new Locale('cs-CZ')],
    [Scalar.LocaleArray]: [['cs-CZ', 'en'], ImmutableList([new Locale('cs-CZ'), new Locale('en')])],
    [Scalar.Currency]: ['EUR', new Currency('EUR')],
    [Scalar.CurrencyArray]: [['EUR'], ImmutableList([new Currency('EUR')])],
    [Scalar.UUID]: [uuidCode, Uuid.fromCode(uuidCode)],
    [Scalar.UUIDArray]: [[uuidCode], ImmutableList([Uuid.fromCode(uuidCode)])],
    [Scalar.Predecessor]: [5, new Predecessor(false, 5)],
    [Scalar.ReferencedEntityPredecessor]: [-1, new Predecessor(true, -1)],
    [Scalar.ComplexDataObject]: [{ items: [1, 2], name: 'x' }, { items: [1, 2], name: 'x' }]
}

/**
 * Compares converted values; immutable lists are compared item by item, because `Immutable.is` compares the driver's
 * data types by reference.
 */
function expectSameValue(actual: unknown, expected: unknown): void {
    if (ImmutableList.isList(expected)) {
        expect(ImmutableList.isList(actual)).toBe(true)
        expect((actual as ImmutableList<unknown>).toArray()).toEqual((expected as ImmutableList<unknown>).toArray())
    } else {
        expect(actual).toEqual(expected)
    }
}

describe('GraphQLValueConverter.convertValue', () => {
    test.each(Object.entries(samples))('Should convert a %s wire value into the driver data type', (scalar, [wire, expected]) => {
        expectSameValue(GraphQLValueConverter.convertValue(wire, scalar as Scalar), expected)
    })

    test('Should keep a missing value and a value of an unknown scalar as they are', () => {
        expect(GraphQLValueConverter.convertValue(null, Scalar.OffsetDateTime)).toBeNull()
        expect(GraphQLValueConverter.convertValue(undefined, Scalar.Long)).toBeUndefined()
        expect(GraphQLValueConverter.convertValue('2024-07-01', undefined)).toBe('2024-07-01')
    })

    test('Should keep the offset of an offset date time verbatim, `Z` included', () => {
        const converted: OffsetDateTime = GraphQLValueConverter.convertValue('2024-07-01T00:00:00.123Z', Scalar.OffsetDateTime)
        expect(converted.offset).toBe('Z')
        expect(converted.timestamp.seconds).toBe(summerInstant)
        expect(converted.timestamp.nanos).toBe(123_000_000)
    })

    test('Should reject an offset date time without an offset', () => {
        expect(() => GraphQLValueConverter.convertValue('2024-07-01T00:00:00', Scalar.OffsetDateTime)).toThrow()
    })
})

describe('GraphQLValueConverter static entity properties', () => {
    test('Should convert scopes into the driver enum', () => {
        expect(GraphQLValueConverter.convertEntityScope('LIVE')).toBe(EntityScope.Live)
        expect(GraphQLValueConverter.convertEntityScope('ARCHIVED')).toBe(EntityScope.Archive)
        expect(GraphQLValueConverter.convertEntityScope(null)).toBeUndefined()
        expect(GraphQLValueConverter.convertEntityScope('FUTURE_SCOPE')).toBe('FUTURE_SCOPE')
    })

    test('Should convert price inner record handling into the driver enum used by the gRPC path', () => {
        expect(GraphQLValueConverter.convertPriceInnerRecordHandling('NONE')).toBe(PriceInnerRecordHandling.None)
        expect(GraphQLValueConverter.convertPriceInnerRecordHandling('LOWEST_PRICE')).toBe(PriceInnerRecordHandling.LowestPrice)
        expect(GraphQLValueConverter.convertPriceInnerRecordHandling('SUM')).toBe(PriceInnerRecordHandling.Sum)
        expect(GraphQLValueConverter.convertPriceInnerRecordHandling('UNKNOWN')).toBe(PriceInnerRecordHandling.Unknown)
        expect(GraphQLValueConverter.convertPriceInnerRecordHandling(null)).toBeUndefined()
        expect(GraphQLValueConverter.convertPriceInnerRecordHandling(undefined)).toBeUndefined()
    })

    test('Should convert the locale enum, which uses `_` in place of `-`, into locales', () => {
        const converted: ImmutableList<Locale> | undefined = GraphQLValueConverter.convertLocaleEnumArray(['cs_CZ', 'en', 'zh_Hant_TW'])
        expectSameValue(converted, ImmutableList([new Locale('cs-CZ'), new Locale('en'), new Locale('zh-Hant-TW')]))
        expect(GraphQLValueConverter.convertLocaleEnumArray(null)).toBeUndefined()
    })
})

type GrpcEvitaValueInit = MessageInitShape<typeof GrpcEvitaValueSchema>

function convertGrpc(init: GrpcEvitaValueInit): unknown {
    const value = create(GrpcEvitaValueSchema, init)
    return EvitaValueConverter.convertGrpcValue(value, value.value.case)
}

function grpcOffsetDateTime(seconds: bigint, offset: string): { timestamp: { seconds: bigint, nanos: number }, offset: string } {
    return { timestamp: { seconds, nanos: 0 }, offset }
}

describe('GraphQL and gRPC paths', () => {
    // 10:15:30 on 0000-01-01 UTC, the day evitaDB anchors local times on
    const localTimeSeconds: bigint = -62167219200n + 36930n

    const cases: ReadonlyArray<readonly [string, Scalar, unknown, GrpcEvitaValueInit]> = [
        ['Long', Scalar.Long, '9007199254740993',
            { type: GrpcEvitaDataType.LONG, value: { case: 'longValue', value: '9007199254740993' } }],
        ['BigDecimal', Scalar.BigDecimal, '10.50',
            { type: GrpcEvitaDataType.BIG_DECIMAL, value: { case: 'bigDecimalValue', value: { valueString: '10.50' } } }],
        ['OffsetDateTime', Scalar.OffsetDateTime, '2024-07-01T02:00:00+02:00',
            { type: GrpcEvitaDataType.OFFSET_DATE_TIME, value: { case: 'offsetDateTimeValue', value: grpcOffsetDateTime(summerInstant, '+02:00') } }],
        ['OffsetDateTime in UTC', Scalar.OffsetDateTime, '2024-07-01T00:00:00Z',
            { type: GrpcEvitaDataType.OFFSET_DATE_TIME, value: { case: 'offsetDateTimeValue', value: grpcOffsetDateTime(summerInstant, 'Z') } }],
        ['LocalDateTime', Scalar.LocalDateTime, '2024-07-01T10:15:30',
            { type: GrpcEvitaDataType.LOCAL_DATE_TIME, value: { case: 'offsetDateTimeValue', value: grpcOffsetDateTime(summerInstant + 36930n, 'Z') } }],
        ['LocalDate', Scalar.LocalDate, '2024-07-01',
            { type: GrpcEvitaDataType.LOCAL_DATE, value: { case: 'offsetDateTimeValue', value: grpcOffsetDateTime(summerInstant, 'Z') } }],
        ['LocalTime', Scalar.LocalTime, '10:15:30',
            { type: GrpcEvitaDataType.LOCAL_TIME, value: { case: 'offsetDateTimeValue', value: grpcOffsetDateTime(localTimeSeconds, 'Z') } }],
        ['DateTimeRange', Scalar.DateTimeRange, ['2024-07-01T02:00:00+02:00', null],
            { type: GrpcEvitaDataType.DATE_TIME_RANGE, value: { case: 'dateTimeRangeValue', value: { from: grpcOffsetDateTime(summerInstant, '+02:00') } } }],
        ['BigDecimalNumberRange', Scalar.BigDecimalNumberRange, ['1.5', '2'],
            { type: GrpcEvitaDataType.BIG_DECIMAL_NUMBER_RANGE, value: { case: 'bigDecimalNumberRangeValue', value: { from: { valueString: '1.5' }, to: { valueString: '2' } } } }],
        ['ByteNumberRange', Scalar.ByteNumberRange, [0, null],
            { type: GrpcEvitaDataType.BYTE_NUMBER_RANGE, value: { case: 'integerNumberRangeValue', value: { from: 0 } } }],
        ['ShortNumberRange', Scalar.ShortNumberRange, [1, 5],
            { type: GrpcEvitaDataType.SHORT_NUMBER_RANGE, value: { case: 'integerNumberRangeValue', value: { from: 1, to: 5 } } }],
        ['IntegerNumberRange', Scalar.IntegerNumberRange, [null, 5],
            { type: GrpcEvitaDataType.INTEGER_NUMBER_RANGE, value: { case: 'integerNumberRangeValue', value: { to: 5 } } }],
        ['LongNumberRange', Scalar.LongNumberRange, ['1', '9007199254740993'],
            { type: GrpcEvitaDataType.LONG_NUMBER_RANGE, value: { case: 'longNumberRangeValue', value: { from: 1n, to: 9007199254740993n } } }],
        ['Predecessor (head)', Scalar.Predecessor, -1,
            { type: GrpcEvitaDataType.PREDECESSOR, value: { case: 'predecessorValue', value: { head: true } } }],
        ['Predecessor', Scalar.Predecessor, 5,
            { type: GrpcEvitaDataType.PREDECESSOR, value: { case: 'predecessorValue', value: { head: false, predecessorId: 5 } } }],
        ['UUID', Scalar.UUID, uuidCode,
            { type: GrpcEvitaDataType.UUID, value: { case: 'uuidValue', value: EvitaValueConverter.convertUuid(Uuid.fromCode(uuidCode)) } }],
        ['OffsetDateTimeArray', Scalar.OffsetDateTimeArray, ['2024-07-01T02:00:00+02:00'],
            { type: GrpcEvitaDataType.OFFSET_DATE_TIME_ARRAY, value: { case: 'offsetDateTimeArrayValue', value: { value: [grpcOffsetDateTime(summerInstant, '+02:00')] } } }]
    ]

    test.each(cases)('Should convert %s to the same model value', (_name, scalar, wire, grpc) => {
        expectSameValue(GraphQLValueConverter.convertValue(wire, scalar), convertGrpc(grpc))
    })

    test('Should convert the entity scope to the same model value', () => {
        expect(GraphQLValueConverter.convertEntityScope('LIVE')).toBe(EntityConverter.convertEntityScope(GrpcEntityScope.SCOPE_LIVE))
        expect(GraphQLValueConverter.convertEntityScope('ARCHIVED')).toBe(EntityConverter.convertEntityScope(GrpcEntityScope.SCOPE_ARCHIVED))
    })

    test('Should convert the price inner record handling to the same model value', () => {
        expect(GraphQLValueConverter.convertPriceInnerRecordHandling('SUM')).toBe(PriceInnerRecordHandling.Sum)
        expect(GraphQLValueConverter.convertPriceInnerRecordHandling('SUM'))
            .toBe(EntityConverter.convertPriceInnerHandling(GrpcPriceInnerRecordHandling.SUM))
        expect(GraphQLValueConverter.convertPriceInnerRecordHandling('LOWEST_PRICE'))
            .toBe(EntityConverter.convertPriceInnerHandling(GrpcPriceInnerRecordHandling.LOWEST_PRICE))
        expect(GraphQLValueConverter.convertPriceInnerRecordHandling('NONE'))
            .toBe(EntityConverter.convertPriceInnerHandling(GrpcPriceInnerRecordHandling.NONE))
    })

    test('Should convert a price, `indexed` and the typed fields included, to the same model value', () => {
        const graphQLPrice: EntityPrice = GraphQLValueConverter.convertPrice({
            priceId: 566,
            priceList: 'basic',
            currency: 'CZK',
            innerRecordId: 66577,
            indexed: true,
            validity: ['2024-07-01T02:00:00+02:00', null],
            priceWithoutTax: '32223.14',
            priceWithTax: '38990.0',
            taxRate: '21.0'
        })
        const grpcPrice: EntityPrice = EntityPrice.fromPrice(new Price(
            566,
            'basic',
            66577,
            new BigDecimal('32223.14'),
            new BigDecimal('21.0'),
            new BigDecimal('38990.0'),
            new DateTimeRange(EvitaValueConverter.convertGrpcValue(
                create(GrpcEvitaValueSchema, { type: GrpcEvitaDataType.OFFSET_DATE_TIME, value: { case: 'offsetDateTimeValue', value: grpcOffsetDateTime(summerInstant, '+02:00') } }),
                'offsetDateTimeValue'
            ), undefined),
            true,
            1,
            new Currency('CZK')
        ))

        expect(graphQLPrice).toEqual(grpcPrice)
    })

    test('Should convert a price without inner record and validity', () => {
        const price: EntityPrice = GraphQLValueConverter.convertPrice({
            priceId: 1,
            priceList: 'basic',
            currency: 'EUR',
            innerRecordId: null,
            indexed: false,
            validity: null,
            priceWithoutTax: '10',
            priceWithTax: '12.1',
            taxRate: '21'
        })

        expect(price.innerRecordId).toBeUndefined()
        expect(price.validity).toBeUndefined()
        expect(price.indexed).toBe(false)
        expect(price.priceWithTax).toEqual(new BigDecimal('12.1'))
    })
})
