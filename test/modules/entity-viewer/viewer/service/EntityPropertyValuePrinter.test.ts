import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { List, Map } from 'immutable'
import { Settings } from 'luxon'
import { Scalar } from '@/modules/database-driver/data-type/Scalar'
import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime'
import { Locale } from '@/modules/database-driver/data-type/Locale'
import { BigDecimal } from '@/modules/database-driver/data-type/BigDecimal'
import { Currency } from '@/modules/database-driver/data-type/Currency'
import { PriceInnerRecordHandling } from '@/modules/database-driver/data-type/PriceInnerRecordHandling'
import { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope'
import { AttributeSchema } from '@/modules/database-driver/request-response/schema/AttributeSchema'
import type { Schema } from '@/modules/database-driver/request-response/schema/Schema'
import { NamingConvention } from '@/modules/database-driver/request-response/NamingConvetion'
import { Price } from '@/modules/database-driver/request-response/data/Price'
import { EvitaValuePrinter } from '@/modules/value-presentation/service/EvitaValuePrinter'
import { LocalDate } from '@/modules/database-driver/data-type/LocalDate'
import { LocalTime } from '@/modules/database-driver/data-type/LocalTime'
import { LocalDateTime } from '@/modules/database-driver/data-type/LocalDateTime'
import { Uuid } from '@/modules/database-driver/data-type/Uuid'
import { Predecessor } from '@/modules/database-driver/data-type/Predecessor'
import { EntityPropertyDescriptor } from '@/modules/entity-viewer/viewer/model/EntityPropertyDescriptor'
import { EntityPropertyKey } from '@/modules/entity-viewer/viewer/model/EntityPropertyKey'
import { EntityPropertyType } from '@/modules/entity-viewer/viewer/model/EntityPropertyType'
import { StaticEntityProperties } from '@/modules/entity-viewer/viewer/model/StaticEntityProperties'
import type { FlatEntity } from '@/modules/entity-viewer/viewer/model/FlatEntity'
import { QueryPriceMode } from '@/modules/entity-viewer/viewer/model/QueryPriceMode'
import { NativeValue } from '@/modules/entity-viewer/viewer/model/entity-property-value/NativeValue'
import { EntityPrice } from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityPrice'
import { EntityPrices } from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityPrices'
import { EntityReferenceValue } from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityReferenceValue'
import {
    type EntityGridValue,
    EntityPropertyValuePrinter
} from '@/modules/entity-viewer/viewer/service/EntityPropertyValuePrinter'

// 2024-07-01T00:00:00Z
const summerInstant: bigint = 1719792000n
const row: FlatEntity = {}
const evitaValuePrinter: EvitaValuePrinter = new EvitaValuePrinter()
const entityPropertyValuePrinter: EntityPropertyValuePrinter = new EntityPropertyValuePrinter(evitaValuePrinter)

function descriptor(type: EntityPropertyType, key: EntityPropertyKey, schema?: Schema): EntityPropertyDescriptor {
    return new EntityPropertyDescriptor(type, key, key.toString(), key.toString(), undefined, schema, List())
}

function attribute(name: string, type: Scalar): AttributeSchema {
    return new AttributeSchema(name, Map<NamingConvention, string>(), undefined, undefined, type, true, undefined,
        false, 0, List(), List(), List())
}

function entityProperty(name: StaticEntityProperties): EntityPropertyDescriptor {
    return descriptor(EntityPropertyType.Entity, EntityPropertyKey.entity(name))
}

function attributeProperty(name: string, type: Scalar): EntityPropertyDescriptor {
    return descriptor(EntityPropertyType.Attributes, EntityPropertyKey.attributes(name), attribute(name, type))
}

function print(propertyDescriptor: EntityPropertyDescriptor, value: EntityGridValue | undefined,
               priceType: QueryPriceMode = QueryPriceMode.WithTax): string {
    return entityPropertyValuePrinter.forColumn(propertyDescriptor).print(value, row, { priceType })
}

function price(): EntityPrice {
    return EntityPrice.fromPrice(new Price(1, 'basic', undefined, new BigDecimal('10.0'), new BigDecimal('21.0'),
        new BigDecimal('12.1'), undefined, true, 1, new Currency('EUR')))
}

describe('EntityPropertyValuePrinter.forColumn', () => {
    let originalDefaultLocale: string

    beforeEach(() => {
        originalDefaultLocale = Settings.defaultLocale
        Settings.defaultLocale = 'en-US'
    })

    afterEach(() => {
        Settings.defaultLocale = originalDefaultLocale
    })

    test('Should print a missing value and an empty array as an empty string', () => {
        const column: EntityPropertyDescriptor = attributeProperty('tags', Scalar.StringArray)
        expect(print(column, undefined)).toBe('')
        expect(print(column, [])).toBe('')
        expect(print(column, new NativeValue(undefined))).toBe('')
        expect(print(entityProperty(StaticEntityProperties.Scope), undefined)).toBe('')
        expect(print(entityProperty(StaticEntityProperties.Scope), new NativeValue(undefined))).toBe('')
        expect(print(entityProperty(StaticEntityProperties.PriceInnerRecordHandling), new NativeValue(undefined))).toBe('')
    })

    test('Should print a scalar column by the scalar of its schema', () => {
        const validity: OffsetDateTime = OffsetDateTime.of(summerInstant, 0, '+02:00')
        expect(print(attributeProperty('validity', Scalar.OffsetDateTime), new NativeValue(validity)))
            .toBe(evitaValuePrinter.print(validity, Scalar.OffsetDateTime))
        expect(print(attributeProperty('ean', Scalar.Long), new NativeValue(1234567890123n))).toBe('1234567890123')
    })

    test('Should print an array column item by item and complex data holding an array as JSON', () => {
        expect(print(entityProperty(StaticEntityProperties.Locales), [new NativeValue(new Locale('cs-CZ')), new NativeValue(new Locale('en'))]))
            .toBe('[cs-CZ, en]')
        expect(print(attributeProperty('data', Scalar.ComplexDataObject), [new NativeValue('a'), new NativeValue({ b: 1 })]))
            .toBe('["a",{"b":1}]')
    })

    test('Should print enum columns translated', () => {
        expect(print(entityProperty(StaticEntityProperties.Scope), new NativeValue(EntityScope.Archive))).toBe('Archived')
        expect(print(entityProperty(StaticEntityProperties.PriceInnerRecordHandling), new NativeValue(PriceInnerRecordHandling.LowestPrice)))
            .toBe('Lowest price')
    })

    test('Should print an unknown enum value by its string form', () => {
        expect(print(entityProperty(StaticEntityProperties.Scope), new NativeValue('Live'))).toBe('Live')
    })
})

describe('EntityPropertyValuePrinter.printEnum', () => {
    test('Should print enum properties as their grid column does', () => {
        const scope: EntityPropertyDescriptor = entityProperty(StaticEntityProperties.Scope)
        const value: NativeValue = new NativeValue(EntityScope.Live)
        expect(entityPropertyValuePrinter.printEnum(scope, value)).toBe(print(scope, value))
        expect(entityPropertyValuePrinter.printEnum(scope, new NativeValue(undefined))).toBe('')
    })

    test('Should return undefined for properties that are not enums', () => {
        expect(entityPropertyValuePrinter.printEnum(attributeProperty('code', Scalar.String), new NativeValue('a'))).toBeUndefined()
        expect(entityPropertyValuePrinter.printEnum(entityProperty(StaticEntityProperties.PrimaryKey), new NativeValue(1))).toBeUndefined()
    })

    test('Should print composite columns themselves with the entity viewer context', () => {
        const prices: EntityPrices = new EntityPrices(price(), [price()])
        const pricesColumn: EntityPropertyDescriptor = descriptor(EntityPropertyType.Prices, EntityPropertyKey.prices())

        expect(print(pricesColumn, prices, QueryPriceMode.WithTax)).toBe(prices.toPreviewString({ priceType: QueryPriceMode.WithTax }))
        expect(print(pricesColumn, prices, QueryPriceMode.WithoutTax)).toBe(prices.toPreviewString({ priceType: QueryPriceMode.WithoutTax }))
        expect(print(pricesColumn, prices, QueryPriceMode.WithTax)).not.toBe(print(pricesColumn, prices, QueryPriceMode.WithoutTax))

        const parent: EntityReferenceValue = new EntityReferenceValue(5, [])
        expect(print(entityProperty(StaticEntityProperties.ParentPrimaryKey), parent)).toBe(parent.toPreviewString())
    })
})

describe('EntityPropertyValuePrinter.print', () => {
    test('Should print a missing value and an empty array as an empty string', () => {
        expect(entityPropertyValuePrinter.print(undefined)).toBe('')
        expect(entityPropertyValuePrinter.print([])).toBe('')
        expect(entityPropertyValuePrinter.print(new NativeValue(undefined))).toBe('')
        expect(entityPropertyValuePrinter.print(new NativeValue(null as unknown as undefined))).toBe('')
    })

    test('Should print native values by their runtime type', () => {
        const date: LocalDate = new LocalDate('2026-10-28')
        const uuidCode: string = '123e4567-e89b-12d3-a456-426614174000'
        expect(entityPropertyValuePrinter.print(new NativeValue('code'))).toBe('code')
        expect(entityPropertyValuePrinter.print(new NativeValue(date))).toBe(evitaValuePrinter.print(date))
        expect(entityPropertyValuePrinter.print(new NativeValue(Uuid.fromCode(uuidCode)))).toBe(uuidCode)
        expect(entityPropertyValuePrinter.print(new NativeValue(42))).toBe('42')
        expect(entityPropertyValuePrinter.print(new NativeValue(false))).toBe('false')
        expect(entityPropertyValuePrinter.print(new NativeValue({ id: 5n }))).toBe('{"id":"5"}')
        expect(entityPropertyValuePrinter.print(new NativeValue(new Predecessor(true, -1)))).toBe('Head')
    })

    test('Should print an immutable list item by item and a plain array as JSON', () => {
        expect(entityPropertyValuePrinter.print(new NativeValue(List([new Locale('cs'), new Locale('en')]))))
            .toBe('[cs, en]')
        expect(entityPropertyValuePrinter.print(new NativeValue([1, 'a'] as unknown as object))).toBe('[1,"a"]')
    })

    test('Should not throw on local date-time values', () => {
        expect(() => entityPropertyValuePrinter.print(new NativeValue(new LocalDate('2026-08-26')))).not.toThrow()
        expect(() => entityPropertyValuePrinter.print(new NativeValue(new LocalTime('10:15:30')))).not.toThrow()
        expect(() => entityPropertyValuePrinter.print(new NativeValue(new LocalDateTime('2026-08-26T10:15:30')))).not.toThrow()
    })

    test('Should print arrays item by item', () => {
        expect(entityPropertyValuePrinter.print([new NativeValue(1), new NativeValue(2)])).toBe('[1, 2]')
    })

    test('Should print a single item without brackets', () => {
        expect(entityPropertyValuePrinter.printItem(new NativeValue(1))).toBe('1')
    })

    test('Should print prices in the requested price type', () => {
        const prices: EntityPrices = new EntityPrices(price(), [price()])
        const withTax: string = entityPropertyValuePrinter.print(prices, { priceType: QueryPriceMode.WithTax })
        const withoutTax: string = entityPropertyValuePrinter.print(prices, { priceType: QueryPriceMode.WithoutTax })

        expect(withTax).toContain('12.1')
        expect(withoutTax).toContain('10')
        expect(withTax).not.toBe(withoutTax)
    })
})
