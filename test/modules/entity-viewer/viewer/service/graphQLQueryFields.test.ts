import { describe, expect, test } from 'vitest'
import { GraphQLQueryBuilder } from '@/modules/entity-viewer/viewer/service/GraphQLQueryBuilder'
import { EntityPropertyKey } from '@/modules/entity-viewer/viewer/model/EntityPropertyKey'
import type { EvitaClient } from '@/modules/database-driver/EvitaClient'
import type { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'
import { StaticEntityProperties } from '@/modules/entity-viewer/viewer/model/StaticEntityProperties'
import { EntityViewerDataPointer } from '@/modules/entity-viewer/viewer/model/EntityViewerDataPointer'
import { AttributeSchema } from '@/modules/database-driver/request-response/schema/AttributeSchema'
import { AssociatedDataSchema } from '@/modules/database-driver/request-response/schema/AssociatedDataSchema'
import { NamingConvention } from '@/modules/database-driver/request-response/NamingConvetion'
import { Scalar } from '@/modules/database-driver/data-type/Scalar'
import { List, Map } from 'immutable'

/**
 * Pins entity fields the GraphQL query selects to their meaning in the evitaDB GraphQL API: an unknown field fails the
 * whole query (`sellable` was renamed `indexed` in evitaDB 2024.10), and a field of the same name may mean something
 * else than in gRPC (`locales` are only the requested locales there).
 */

// Building these fields does not touch the EvitaClient dependency.
const graphql: GraphQLQueryBuilder = new GraphQLQueryBuilder(undefined as unknown as EvitaClient)

function priceFields(filterBy: string): string {
    const entityOutputFields: string[] = []
    graphql['buildPricesProperty']([EntityPropertyKey.prices()], filterBy, entityOutputFields)
    return entityOutputFields.join('\n')
}

describe('GraphQLQueryBuilder price fields', () => {
    test('Should select `indexed`, not the removed `sellable`', () => {
        const fields: string = priceFields('')

        expect(fields).toMatch(/\bindexed\b/)
        expect(fields).not.toMatch(/\bsellable\b/)
    })

    test('Should select the price for sale with the same fields when price list and currency are filtered', () => {
        const fields: string = priceFields('priceInPriceLists: "basic", priceInCurrency: CZK')

        expect(fields).toContain('priceForSale')
        expect(fields.match(/\bindexed\b/g)).toHaveLength(2)
    })
})

describe('GraphQLQueryBuilder entity body fields', () => {
    test('Should select all locales of the entity, like the gRPC entity locales', () => {
        const entityOutputFields: string[] = []
        graphql['buildEntityBodyProperties'](
            [EntityPropertyKey.entity(StaticEntityProperties.Locales)],
            undefined as unknown as EntitySchema,
            undefined,
            entityOutputFields
        )

        expect(entityOutputFields).toEqual(['allLocales'])
    })
})

describe('GraphQLQueryBuilder attribute and associated data fields', () => {
    const camelCase = (name: string): Map<NamingConvention, string> => Map([[NamingConvention.CamelCase, name]])
    const schema: EntitySchema = {
        attributes: Map([['battery-life', new AttributeSchema('battery-life', camelCase('batteryLife'), undefined, undefined,
            Scalar.BigDecimal, true, undefined, false, 0, List(), List(), List())]]),
        associatedData: Map([['feed-google', new AssociatedDataSchema('feed-google', camelCase('feedGoogle'), undefined,
            undefined, Scalar.String, true, false)]])
    } as unknown as EntitySchema
    const dataPointer: EntityViewerDataPointer = new EntityViewerDataPointer(undefined as never, 'catalog', 'Product')

    test('Should select attributes by their camelCase name, the only form valid in GraphQL', () => {
        const entityOutputFields: string[] = []
        graphql['buildAttributesProperty']([EntityPropertyKey.attributes('battery-life')], schema, dataPointer, undefined, entityOutputFields)

        expect(entityOutputFields).toEqual(['attributes {', 'batteryLife', '}'])
    })

    test('Should select associated data by their camelCase name', () => {
        const entityOutputFields: string[] = []
        graphql['buildAssociatedDataProperty']([EntityPropertyKey.associatedData('feed-google')], schema, dataPointer, undefined, entityOutputFields)

        expect(entityOutputFields).toEqual(['associatedData {', 'feedGoogle', '}'])
    })
})
