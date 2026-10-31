import { describe, expect, test } from 'vitest'
import { List, Map } from 'immutable'
import { Scalar } from '@/modules/database-driver/data-type/Scalar'
import { BigDecimal } from '@/modules/database-driver/data-type/BigDecimal'
import { LocalDate } from '@/modules/database-driver/data-type/LocalDate'
import { Locale } from '@/modules/database-driver/data-type/Locale'
import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime'
import { PriceInnerRecordHandling } from '@/modules/database-driver/data-type/PriceInnerRecordHandling'
import { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope'
import { NamingConvention } from '@/modules/database-driver/request-response/NamingConvetion'
import { AttributeSchema } from '@/modules/database-driver/request-response/schema/AttributeSchema'
import { AssociatedDataSchema } from '@/modules/database-driver/request-response/schema/AssociatedDataSchema'
import { ReferenceAttributeSchema } from '@/modules/database-driver/request-response/schema/ReferenceAttributeSchema'
import { ReferenceSchema } from '@/modules/database-driver/request-response/schema/ReferenceSchema'
import { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'
import { Cardinality } from '@/modules/database-driver/request-response/schema/Cardinality'
import type { EvitaClient } from '@/modules/database-driver/EvitaClient'
import type { EvitaClientSession } from '@/modules/database-driver/EvitaClientSession'
import { GraphQLQueryExecutor } from '@/modules/entity-viewer/viewer/service/GraphQLQueryExecutor'
import { EntityViewerDataPointer } from '@/modules/entity-viewer/viewer/model/EntityViewerDataPointer'
import { EntityPropertyKey } from '@/modules/entity-viewer/viewer/model/EntityPropertyKey'
import { StaticEntityProperties } from '@/modules/entity-viewer/viewer/model/StaticEntityProperties'
import type { FlatEntity } from '@/modules/entity-viewer/viewer/model/FlatEntity'
import { EntityPropertyValue } from '@/modules/entity-viewer/viewer/model/EntityPropertyValue'
import { EntityReferenceValue } from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityReferenceValue'
import { EntityReferences } from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityReferences'
import {
    EntityReferenceAttributes
} from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityReferenceAttributes'

// 2024-07-01T00:00:00Z
const summerInstant: bigint = 1719792000n

/**
 * Schema names deliberately differ from their camelCase variants, so that a lookup under the wrong naming finds
 * nothing and leaves the value raw.
 */
function camelCase(camelCaseName: string): Map<NamingConvention, string> {
    return Map<NamingConvention, string>([[NamingConvention.CamelCase, camelCaseName]])
}

function attribute(name: string, camelCaseName: string, type: Scalar): AttributeSchema {
    return new AttributeSchema(name, camelCase(camelCaseName), undefined, undefined, type, true, undefined, false, 0,
        List(), List(), List())
}

function referenceAttribute(name: string, camelCaseName: string, type: Scalar): ReferenceAttributeSchema {
    return new ReferenceAttributeSchema(name, camelCase(camelCaseName), undefined, undefined, type, true, undefined,
        false, 0, true, List(), List(), List())
}

function entitySchema(attributes: AttributeSchema[], associatedData: AssociatedDataSchema[], references: ReferenceSchema[]): EntitySchema {
    return {
        attributes: Map(attributes.map(it => [it.name, it])),
        associatedData: Map(associatedData.map(it => [it.name, it])),
        references: Map(references.map(it => [it.name, it]))
    } as unknown as EntitySchema
}

const productSchema: EntitySchema = entitySchema(
    [attribute('valid_from', 'validFrom', Scalar.OffsetDateTime)],
    [new AssociatedDataSchema('stock_count', camelCase('stockCount'), undefined, undefined, Scalar.Long, true, false)],
    [new ReferenceSchema(
        'brand', camelCase('brand'), undefined, undefined, 'Brand', true, camelCase('brand'),
        undefined, undefined, undefined, Cardinality.ZeroOrMore,
        [referenceAttribute('order_price', 'orderPrice', Scalar.BigDecimal)],
        [], List(), List(), List(), List(), List()
    )]
)
const brandSchema: EntitySchema = entitySchema([attribute('launch_date', 'launchDate', Scalar.LocalDate)], [], [])

const responseNode = {
    primaryKey: 1,
    version: 2,
    scope: 'ARCHIVED',
    allLocales: ['cs_CZ'],
    priceInnerRecordHandling: 'SUM',
    parents: [{ primaryKey: 7, attributes: { validFrom: '2024-07-01T00:00:00Z' } }],
    attributes: { validFrom: '2024-07-01T02:00:00+02:00', unknown: '2024-07-01', missing: null },
    associatedData: { stockCount: '9007199254740993', missingData: null },
    reference_brand: [{
        referencedPrimaryKey: 3,
        attributes: { orderPrice: '10.5' },
        referencedEntity: { attributes: { launchDate: '2024-07-01' } }
    }]
}

const requiredData: EntityPropertyKey[] = [
    EntityPropertyKey.entity(StaticEntityProperties.PrimaryKey),
    EntityPropertyKey.entity(StaticEntityProperties.ParentPrimaryKey),
    EntityPropertyKey.attributes('valid_from'),
    EntityPropertyKey.associatedData('stock_count'),
    EntityPropertyKey.references('brand'),
    EntityPropertyKey.referenceAttributes('brand', 'order_price')
]

/**
 * A client answering the GraphQL query with {@link responseNode} and serving the schemas from a session.
 */
function fakeClient(loadedSchemas: string[]): EvitaClient {
    const schemas: Record<string, EntitySchema> = { Product: productSchema, Brand: brandSchema }
    const session = {
        getEntitySchemaOrThrowException: async (entityType: string) => {
            loadedSchemas.push(entityType)
            return schemas[entityType]
        }
    } as unknown as EvitaClientSession
    return {
        queryCatalogUsingGraphQL: async () => ({ data: { q: { recordPage: { data: [responseNode], totalRecordCount: 1 } } } }),
        queryCatalog: async <T>(_catalogName: string, queryLogic: (session: EvitaClientSession) => Promise<T>) => queryLogic(session)
    } as unknown as EvitaClient
}

async function convert(loadedSchemas: string[] = []): Promise<FlatEntity> {
    const executor: GraphQLQueryExecutor = new GraphQLQueryExecutor(fakeClient(loadedSchemas))
    const result = await executor.executeQuery(new EntityViewerDataPointer(undefined as never, 'catalog', 'Product'), '', requiredData)
    return result.entities[0]!
}

function valueOf(entity: FlatEntity, key: EntityPropertyKey): unknown {
    return (entity[key.toString()] as EntityPropertyValue).value()
}

describe('GraphQLQueryExecutor value conversion', () => {
    test('Should convert static entity properties into the driver types', async () => {
        const entity: FlatEntity = await convert()

        expect(valueOf(entity, EntityPropertyKey.entity(StaticEntityProperties.Scope))).toBe(EntityScope.Archive)
        expect(valueOf(entity, EntityPropertyKey.entity(StaticEntityProperties.PriceInnerRecordHandling))).toBe(PriceInnerRecordHandling.Sum)
        const locales = entity[EntityPropertyKey.entity(StaticEntityProperties.Locales).toString()] as EntityPropertyValue[]
        expect(locales.map(it => it.value())).toEqual([new Locale('cs-CZ')])
        expect(entity['']).toBeUndefined()
    })

    test('Should convert entity attributes and associated data sent under their camelCase name, keyed by their schema name', async () => {
        const entity: FlatEntity = await convert()

        expect(valueOf(entity, EntityPropertyKey.attributes('valid_from'))).toEqual(OffsetDateTime.of(summerInstant, 0, '+02:00'))
        expect(valueOf(entity, EntityPropertyKey.associatedData('stock_count'))).toBe(9007199254740993n)
    })

    test('Should leave a missing attribute or associated data absent, as the evitaQL path does', async () => {
        const entity: FlatEntity = await convert()

        expect(entity[EntityPropertyKey.attributes('missing').toString()]).toBeUndefined()
        expect(entity[EntityPropertyKey.associatedData('missingData').toString()]).toBeUndefined()
    })

    test('Should keep a value without a schema as it was sent', async () => {
        const entity: FlatEntity = await convert()

        expect(valueOf(entity, EntityPropertyKey.attributes('unknown'))).toBe('2024-07-01')
    })

    test('Should convert the parent representative attributes found by their camelCase name', async () => {
        const entity: FlatEntity = await convert()
        const parent = entity[EntityPropertyKey.entity(StaticEntityProperties.ParentPrimaryKey).toString()] as EntityReferenceValue

        expect(parent.representativeAttributes.map(it => it.value())).toEqual([OffsetDateTime.of(summerInstant, 0, 'Z')])
    })

    test('Should convert reference attributes and target representative attributes found by their camelCase name', async () => {
        const loadedSchemas: string[] = []
        const entity: FlatEntity = await convert(loadedSchemas)
        const references = entity[EntityPropertyKey.references('brand').toString()] as EntityReferences
        const reference: EntityReferenceValue = references.references[0]!

        expect(loadedSchemas).toContain('Brand')
        expect(reference.targetRepresentativeAttributes?.get('launchDate')?.value()).toEqual(new LocalDate('2024-07-01'))
        expect(reference.representativeReferenceAttributes?.get('orderPrice')?.value()).toEqual(new BigDecimal('10.5'))

        const column = entity[EntityPropertyKey.referenceAttributes('brand', 'orderPrice').toString()] as EntityReferenceAttributes
        expect(column.values[0]!.representativeAttributes.map(it => it.value())).toEqual([new BigDecimal('10.5')])
    })
})
