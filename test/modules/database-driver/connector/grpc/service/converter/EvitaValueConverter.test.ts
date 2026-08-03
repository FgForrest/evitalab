import { describe, test, expect } from 'vitest'
import { create, fromJson } from '@bufbuild/protobuf'
import type { JsonValue } from '@bufbuild/protobuf'
import capturedRootPayload from './fixture/associatedDataRoot.json'
import {
    EvitaValueConverter
} from '../../../../../../../src/modules/database-driver/connector/grpc/service/converter/EvitaValueConverter'
import {
    DataItemMapSchema,
    GrpcDataItemArraySchema,
    GrpcDataItemSchema,
    GrpcEvitaAssociatedDataValueSchema,
    GrpcEvitaValueSchema
} from '../../../../../../../src/modules/database-driver/connector/grpc/gen/GrpcEvitaDataTypes_pb'
import type {
    GrpcDataItem,
    GrpcEvitaValue
} from '../../../../../../../src/modules/database-driver/connector/grpc/gen/GrpcEvitaDataTypes_pb'
import {
    GrpcEvitaAssociatedDataDataType_GrpcEvitaDataType,
    GrpcEvitaDataType
} from '../../../../../../../src/modules/database-driver/connector/grpc/gen/GrpcEnums_pb'
import { UnexpectedError } from '../../../../../../../src/modules/base/exception/UnexpectedError'
import { Uuid } from '../../../../../../../src/modules/database-driver/data-type/Uuid'

const uuidCode: string = '4c6d4ef3-2b1a-4b0e-9c7a-2f3a1d5e6b70'
const uuid: Uuid = Uuid.fromCode(uuidCode)

/**
 * Wraps a primitive value into a data item leaf.
 */
function leaf(value: GrpcEvitaValue): GrpcDataItem {
    return create(GrpcDataItemSchema, { value: { case: 'primitiveValue', value } })
}

function map(properties: { [name: string]: GrpcDataItem }): GrpcDataItem {
    return create(GrpcDataItemSchema, {
        value: {
            case: 'mapValue',
            value: create(DataItemMapSchema, { data: properties })
        }
    })
}

function array(children: GrpcDataItem[]): GrpcDataItem {
    return create(GrpcDataItemSchema, {
        value: {
            case: 'arrayValue',
            value: create(GrpcDataItemArraySchema, { children })
        }
    })
}

function stringValue(value: string): GrpcEvitaValue {
    return create(GrpcEvitaValueSchema, {
        type: GrpcEvitaDataType.STRING,
        value: { case: 'stringValue', value }
    })
}

function integerValue(value: number): GrpcEvitaValue {
    return create(GrpcEvitaValueSchema, {
        type: GrpcEvitaDataType.INTEGER,
        value: { case: 'integerValue', value }
    })
}

function longValue(value: string): GrpcEvitaValue {
    return create(GrpcEvitaValueSchema, {
        type: GrpcEvitaDataType.LONG,
        value: { case: 'longValue', value }
    })
}

function bigDecimalValue(value: string): GrpcEvitaValue {
    return create(GrpcEvitaValueSchema, {
        type: GrpcEvitaDataType.BIG_DECIMAL,
        value: { case: 'bigDecimalValue', value: { valueString: value } }
    })
}

function offsetDateTimeValue(
    type: GrpcEvitaDataType,
    seconds: bigint,
    nanos: number,
    offset: string
): GrpcEvitaValue {
    return create(GrpcEvitaValueSchema, {
        type,
        value: {
            case: 'offsetDateTimeValue',
            value: { timestamp: { seconds, nanos }, offset }
        }
    })
}

/**
 * Value of a null property of a complex data object - the server sends an empty value message for it.
 */
function nullValue(): GrpcEvitaValue {
    return create(GrpcEvitaValueSchema, {})
}

describe('EvitaValueConverter.convertGrpcDataItem', () => {

    test('Should convert a bare primitive root', () => {
        expect(EvitaValueConverter.convertGrpcDataItem(leaf(stringValue('single')))).toEqual('single')
    })

    test('Should project all leaf types the same way as the deprecated JSON form', () => {
        const tree: GrpcDataItem = map({
            byte: leaf(create(GrpcEvitaValueSchema, {
                type: GrpcEvitaDataType.BYTE,
                value: { case: 'integerValue', value: 5 }
            })),
            short: leaf(create(GrpcEvitaValueSchema, {
                type: GrpcEvitaDataType.SHORT,
                value: { case: 'integerValue', value: 300 }
            })),
            integer: leaf(integerValue(42)),
            long: leaf(longValue('9007199254740993')),
            string: leaf(stringValue('some text')),
            bigDecimal: leaf(bigDecimalValue('1.230')),
            boolean: leaf(create(GrpcEvitaValueSchema, {
                type: GrpcEvitaDataType.BOOLEAN,
                value: { case: 'booleanValue', value: true }
            })),
            character: leaf(create(GrpcEvitaValueSchema, {
                type: GrpcEvitaDataType.CHARACTER,
                value: { case: 'stringValue', value: 'c' }
            })),
            locale: leaf(create(GrpcEvitaValueSchema, {
                type: GrpcEvitaDataType.LOCALE,
                value: { case: 'localeValue', value: { languageTag: 'cs-CZ' } }
            })),
            currency: leaf(create(GrpcEvitaValueSchema, {
                type: GrpcEvitaDataType.CURRENCY,
                value: { case: 'currencyValue', value: { code: 'CZK' } }
            })),
            uuid: leaf(create(GrpcEvitaValueSchema, {
                type: GrpcEvitaDataType.UUID,
                value: {
                    case: 'uuidValue',
                    value: {
                        mostSignificantBits: uuid.mostSignificantBits.toString(),
                        leastSignificantBits: uuid.leastSignificantBits.toString()
                    }
                }
            })),
            offsetDateTime: leaf(offsetDateTimeValue(
                GrpcEvitaDataType.OFFSET_DATE_TIME,
                1700000000n,
                123000000,
                '+01:00'
            )),
            localDateTime: leaf(offsetDateTimeValue(
                GrpcEvitaDataType.LOCAL_DATE_TIME,
                1700000000n,
                0,
                'Z'
            )),
            offsetDateTimeWithSingleFractionDigit: leaf(offsetDateTimeValue(
                GrpcEvitaDataType.OFFSET_DATE_TIME,
                1700000000n,
                100000000,
                'Z'
            )),
            offsetDateTimeWithTwoFractionDigits: leaf(offsetDateTimeValue(
                GrpcEvitaDataType.OFFSET_DATE_TIME,
                1700000000n,
                120000000,
                'Z'
            )),
            offsetDateTimeWithSubMillisecondPrecision: leaf(offsetDateTimeValue(
                GrpcEvitaDataType.OFFSET_DATE_TIME,
                1700000000n,
                123456789,
                'Z'
            )),
            localDate: leaf(offsetDateTimeValue(GrpcEvitaDataType.LOCAL_DATE, 1699920000n, 0, 'Z')),
            // local times are sent as instants based at the year 0, exactly as evitaDB builds them
            localTime: leaf(offsetDateTimeValue(GrpcEvitaDataType.LOCAL_TIME, -62167182270n, 0, 'Z')),
            localTimeWithoutSeconds: leaf(offsetDateTimeValue(
                GrpcEvitaDataType.LOCAL_TIME,
                -62167182300n,
                0,
                'Z'
            )),
            integerRange: leaf(create(GrpcEvitaValueSchema, {
                type: GrpcEvitaDataType.INTEGER_NUMBER_RANGE,
                value: { case: 'integerNumberRangeValue', value: { from: 1, to: 10 } }
            })),
            openIntegerRange: leaf(create(GrpcEvitaValueSchema, {
                type: GrpcEvitaDataType.INTEGER_NUMBER_RANGE,
                value: { case: 'integerNumberRangeValue', value: { from: 1 } }
            })),
            nullProperty: leaf(nullValue())
        })

        expect(EvitaValueConverter.convertGrpcDataItem(tree)).toEqual({
            byte: 5,
            short: 300,
            integer: 42,
            long: '9007199254740993',
            string: 'some text',
            bigDecimal: '1.230',
            boolean: true,
            character: 'c',
            locale: 'cs-CZ',
            currency: "'CZK'",
            uuid: `'${uuidCode}'`,
            offsetDateTime: '2023-11-14T23:13:20.123+01:00',
            offsetDateTimeWithSingleFractionDigit: '2023-11-14T22:13:20.1Z',
            offsetDateTimeWithTwoFractionDigits: '2023-11-14T22:13:20.12Z',
            offsetDateTimeWithSubMillisecondPrecision: '2023-11-14T22:13:20.123Z',
            localDateTime: '2023-11-14T22:13:20',
            localDate: '2023-11-14',
            localTime: '10:15:30',
            localTimeWithoutSeconds: '10:15',
            integerRange: '[1,10]',
            openIntegerRange: '[1,]',
            nullProperty: null
        })
    })

    test('Should convert nested maps', () => {
        const tree: GrpcDataItem = map({
            name: leaf(stringValue('root')),
            child: map({
                name: leaf(stringValue('nested')),
                grandChild: map({ name: leaf(stringValue('deep')) })
            })
        })

        expect(EvitaValueConverter.convertGrpcDataItem(tree)).toEqual({
            name: 'root',
            child: {
                name: 'nested',
                grandChild: { name: 'deep' }
            }
        })
    })

    test('Should convert nested arrays', () => {
        const tree: GrpcDataItem = map({
            primitives: array([leaf(integerValue(1)), leaf(integerValue(2))]),
            maps: array([map({ a: leaf(stringValue('x')) }), map({ a: leaf(stringValue('y')) })]),
            arrays: array([array([leaf(integerValue(1))]), array([leaf(integerValue(2))])])
        })

        expect(EvitaValueConverter.convertGrpcDataItem(tree)).toEqual({
            primitives: [1, 2],
            maps: [{ a: 'x' }, { a: 'y' }],
            arrays: [[1], [2]]
        })
    })

    test('Should convert a mixed tree', () => {
        const tree: GrpcDataItem = map({
            variants: array([
                map({
                    code: leaf(stringValue('variant-1')),
                    prices: array([leaf(bigDecimalValue('10.50')), leaf(bigDecimalValue('20.00'))])
                })
            ])
        })

        expect(EvitaValueConverter.convertGrpcDataItem(tree)).toEqual({
            variants: [
                {
                    code: 'variant-1',
                    prices: ['10.50', '20.00']
                }
            ]
        })
    })

    test('Should convert an array root into a plain array', () => {
        const tree: GrpcDataItem = array([leaf(stringValue('a')), leaf(stringValue('b'))])

        const converted = EvitaValueConverter.convertGrpcDataItem(tree)
        expect(Array.isArray(converted)).toBe(true)
        expect(converted).toEqual(['a', 'b'])
    })

    test('Should convert empty containers', () => {
        expect(EvitaValueConverter.convertGrpcDataItem(map({}))).toEqual({})
        expect(EvitaValueConverter.convertGrpcDataItem(array([]))).toEqual([])
    })

    test('Should fail on an unknown data item', () => {
        const emptyItem: GrpcDataItem = create(GrpcDataItemSchema, {})
        expect(() => EvitaValueConverter.convertGrpcDataItem(emptyItem)).toThrow(UnexpectedError)
        expect(() => EvitaValueConverter.convertGrpcDataItem(map({ broken: emptyItem })))
            .toThrow(UnexpectedError)
        expect(() => EvitaValueConverter.convertGrpcDataItem(array([emptyItem])))
            .toThrow(UnexpectedError)
    })

    test('Should convert into a JSON serializable structure', () => {
        const tree: GrpcDataItem = map({
            long: leaf(longValue('9007199254740993')),
            bigDecimal: leaf(bigDecimalValue('1.230')),
            offsetDateTime: leaf(offsetDateTimeValue(
                GrpcEvitaDataType.OFFSET_DATE_TIME,
                1700000000n,
                0,
                'Z'
            )),
            nested: array([map({ long: leaf(longValue('1')) })])
        })

        expect(() => JSON.stringify(EvitaValueConverter.convertGrpcDataItem(tree))).not.toThrow()
    })
})

describe('EvitaValueConverter.convertGrpcAssociatedValue', () => {

    test('Should convert the structured complex data object form', () => {
        const value = create(GrpcEvitaAssociatedDataValueSchema, {
            type: GrpcEvitaAssociatedDataDataType_GrpcEvitaDataType.COMPLEX_DATA_OBJECT,
            value: { case: 'root', value: map({ code: leaf(stringValue('product')) }) }
        })

        expect(EvitaValueConverter.convertGrpcAssociatedValue(value)).toEqual({ code: 'product' })
    })

    test('Should convert the structured form identically to the deprecated JSON form', () => {
        const structuredValue = create(GrpcEvitaAssociatedDataValueSchema, {
            type: GrpcEvitaAssociatedDataDataType_GrpcEvitaDataType.COMPLEX_DATA_OBJECT,
            value: {
                case: 'root',
                value: map({
                    code: leaf(stringValue('product')),
                    quantity: leaf(integerValue(3)),
                    identifier: leaf(longValue('9007199254740993')),
                    price: leaf(bigDecimalValue('10.50')),
                    available: leaf(create(GrpcEvitaValueSchema, {
                        type: GrpcEvitaDataType.BOOLEAN,
                        value: { case: 'booleanValue', value: false }
                    })),
                    locale: leaf(create(GrpcEvitaValueSchema, {
                        type: GrpcEvitaDataType.LOCALE,
                        value: { case: 'localeValue', value: { languageTag: 'cs-CZ' } }
                    })),
                    note: leaf(nullValue()),
                    labels: array([leaf(stringValue('a')), leaf(stringValue('b'))]),
                    nested: map({ code: leaf(stringValue('nested')) })
                })
            }
        })
        const jsonValue = create(GrpcEvitaAssociatedDataValueSchema, {
            type: GrpcEvitaAssociatedDataDataType_GrpcEvitaDataType.COMPLEX_DATA_OBJECT,
            value: {
                case: 'jsonValue',
                value: JSON.stringify({
                    code: 'product',
                    quantity: 3,
                    identifier: '9007199254740993',
                    price: '10.50',
                    available: false,
                    locale: 'cs-CZ',
                    note: null,
                    labels: ['a', 'b'],
                    nested: { code: 'nested' }
                })
            }
        })

        expect(EvitaValueConverter.convertGrpcAssociatedValue(structuredValue))
            .toEqual(EvitaValueConverter.convertGrpcAssociatedValue(jsonValue))
    })

    test('Should convert the deprecated JSON form', () => {
        const value = create(GrpcEvitaAssociatedDataValueSchema, {
            type: GrpcEvitaAssociatedDataDataType_GrpcEvitaDataType.COMPLEX_DATA_OBJECT,
            value: { case: 'jsonValue', value: '{"code":"product"}' }
        })

        expect(EvitaValueConverter.convertGrpcAssociatedValue(value)).toEqual({ code: 'product' })
    })

    test('Should convert a primitive associated data value', () => {
        const value = create(GrpcEvitaAssociatedDataValueSchema, {
            type: GrpcEvitaAssociatedDataDataType_GrpcEvitaDataType.STRING,
            value: { case: 'primitiveValue', value: stringValue('plain') }
        })

        expect(EvitaValueConverter.convertGrpcAssociatedValue(value)).toEqual('plain')
    })

    test('Should convert a payload captured from a real server', () => {
        const value = fromJson(GrpcEvitaAssociatedDataValueSchema, capturedRootPayload as JsonValue)

        expect(EvitaValueConverter.convertGrpcAssociatedValue(value)).toEqual({
            code: 'product-1',
            quantity: 42,
            price: '10.5',
            available: true,
            emptyMap: {},
            emptyArray: [],
            matrix: [[1, 2], [3, 4]],
            nested: { depth: 2, title: 'nested title', tags: ['x', 'y'] },
            labels: ['alpha', 'beta']
        })
    })

    test('Should fail on a missing or unknown associated data value', () => {
        expect(() => EvitaValueConverter.convertGrpcAssociatedValue(undefined)).toThrow(UnexpectedError)
        expect(() => EvitaValueConverter.convertGrpcAssociatedValue(
            create(GrpcEvitaAssociatedDataValueSchema, {})
        )).toThrow(UnexpectedError)
    })
})
