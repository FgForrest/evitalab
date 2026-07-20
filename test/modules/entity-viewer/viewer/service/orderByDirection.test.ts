import { describe, test, expect } from 'vitest'
import { Map as ImmutableMap } from 'immutable'
import { EvitaQLQueryBuilder } from '@/modules/entity-viewer/viewer/service/EvitaQLQueryBuilder'
import { GraphQLQueryBuilder } from '@/modules/entity-viewer/viewer/service/GraphQLQueryBuilder'
import { OrderDirection } from '@/modules/database-driver/request-response/schema/OrderDirection'
import { NamingConvention } from '@/modules/database-driver/request-response/NamingConvetion'
import type { AttributeSchema } from '@/modules/database-driver/request-response/schema/AttributeSchema'
import type { ReferenceSchema } from '@/modules/database-driver/request-response/schema/ReferenceSchema'
import type { EvitaClient } from '@/modules/database-driver/EvitaClient'

/**
 * Characterization test pinning the exact order-direction tokens emitted by the
 * query builders. Both evitaQL and GraphQL grammars require uppercase tokens
 * (ASC/DESC); the {@link OrderDirection} enum stores lowercase values, so the
 * builders uppercase on interpolation. This test guards that contract against
 * regressions in the type-level refactor of the direction handling.
 */

// The order-by builder methods do not touch the EvitaClient dependency.
const evitaClientStub: EvitaClient = undefined as unknown as EvitaClient
const evitaql: EvitaQLQueryBuilder = new EvitaQLQueryBuilder(evitaClientStub)
const graphql: GraphQLQueryBuilder = new GraphQLQueryBuilder(evitaClientStub)

const attributeSchema: AttributeSchema = {
    name: 'code',
    nameVariants: ImmutableMap([[NamingConvention.PascalCase, 'Code']])
} as unknown as AttributeSchema

const referenceSchema: ReferenceSchema = {
    name: 'brand',
    nameVariants: ImmutableMap([[NamingConvention.PascalCase, 'Brand']])
} as unknown as ReferenceSchema

describe('EvitaQLQueryBuilder order-by direction tokens', () => {
    test('primary key order by emits uppercase tokens', () => {
        expect(evitaql.buildPrimaryKeyOrderBy(OrderDirection.Asc)).toBe('entityPrimaryKeyNatural(ASC)')
        expect(evitaql.buildPrimaryKeyOrderBy(OrderDirection.Desc)).toBe('entityPrimaryKeyNatural(DESC)')
    })

    test('attribute order by emits uppercase tokens', () => {
        expect(evitaql.buildAttributeOrderBy(attributeSchema, OrderDirection.Asc))
            .toBe('attributeNatural("code", ASC)')
    })

    test('reference attribute order by emits uppercase tokens', () => {
        expect(evitaql.buildReferenceAttributeOrderBy(referenceSchema, attributeSchema, OrderDirection.Desc))
            .toBe('referenceProperty("brand", attributeNatural("code", DESC))')
    })
})

describe('GraphQLQueryBuilder order-by direction tokens', () => {
    test('primary key order by emits uppercase tokens', () => {
        expect(graphql.buildPrimaryKeyOrderBy(OrderDirection.Asc)).toBe('entityPrimaryKeyNatural: ASC')
        expect(graphql.buildPrimaryKeyOrderBy(OrderDirection.Desc)).toBe('entityPrimaryKeyNatural: DESC')
    })

    test('attribute order by emits uppercase tokens', () => {
        expect(graphql.buildAttributeOrderBy(attributeSchema, OrderDirection.Asc))
            .toBe('attributeCodeNatural: ASC')
    })

    test('reference attribute order by emits uppercase tokens', () => {
        expect(graphql.buildReferenceAttributeOrderBy(referenceSchema, attributeSchema, OrderDirection.Desc))
            .toBe('referenceBrandProperty: { attributeCodeNatural: DESC }')
    })
})
