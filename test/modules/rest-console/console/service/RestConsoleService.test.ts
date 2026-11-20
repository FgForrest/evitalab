import { describe, expect, test } from 'vitest'
import { List as ImmutableList, Map as ImmutableMap } from 'immutable'
import catalogSpec from '../../fixtures/catalog-openapi.json'
import { RestConsoleService, type RestCatalogLocales } from '@/modules/rest-console/console/service/RestConsoleService'
import { RestConsoleDataPointer } from '@/modules/rest-console/console/model/RestConsoleDataPointer'
import { buildRestOperationCatalog } from '@/modules/rest-console/console/service/buildRestOperationCatalog'
import { RestInstanceType } from '@/modules/database-driver/connector/rest/model/RestInstanceType'
import { NamingConvention } from '@/modules/database-driver/request-response/NamingConvetion'
import { Locale } from '@/modules/database-driver/data-type/Locale'
import type { EvitaClient } from '@/modules/database-driver/EvitaClient'
import type { Connection } from '@/modules/connection/model/Connection'
import type { RestOperationCatalog } from '@/modules/rest-console/console/model/RestOperationCatalog'
import type { RestEndpoint } from '@/modules/rest-console/console/model/RestEndpoint'

/**
 * The locale switch offers the locales of the catalog schema: an entity collection's own locales for its endpoints,
 * their union for the catalog-level ones. REST paths use the PascalCase name variant, which need not equal the
 * entity type name.
 */

function entitySchema(name: string, pascalCase: string, locales: string[]): unknown {
    return {
        name,
        nameVariants: ImmutableMap([[NamingConvention.PascalCase, pascalCase]]),
        locales: ImmutableList(locales.map(locale => new Locale(locale)))
    }
}

const client: EvitaClient = {
    queryCatalog: async (_catalogName: string, logic: (session: unknown) => Promise<unknown>) => await logic({
        getCatalogSchema: async () => ({
            entitySchemas: async () => ImmutableMap([
                ['product', entitySchema('product', 'Product', ['en', 'cs'])],
                ['Category', entitySchema('Category', 'Category', ['de'])]
            ])
        })
    })
} as unknown as EvitaClient

const connection: Connection = { id: 'c', name: 'test' } as unknown as Connection
const service: RestConsoleService = new RestConsoleService(client)
const catalog: RestOperationCatalog = buildRestOperationCatalog(catalogSpec, RestInstanceType.Catalog)

function endpoint(id: string): RestEndpoint {
    return catalog.findEndpoint(id) as RestEndpoint
}

describe('REST console locales', () => {
    test('Should map collections by the PascalCase name variant and sort their locales', async () => {
        const locales: RestCatalogLocales = await service.getCatalogLocales(
            new RestConsoleDataPointer(connection, 'evita', RestInstanceType.Catalog)
        )
        expect(locales.byCollection.get('Product')?.toArray()).toEqual(['cs', 'en'])
        expect(locales.byCollection.get('product')).toBeUndefined()
        expect(locales.all.toArray()).toEqual(['cs', 'de', 'en'])
    })

    test('Should offer a collection its own locales and the catalog-level endpoints the union', async () => {
        const locales: RestCatalogLocales = await service.getCatalogLocales(
            new RestConsoleDataPointer(connection, 'evita', RestInstanceType.Catalog)
        )
        expect(service.resolveEndpointLocales(endpoint('queryProduct'), locales).toArray()).toEqual(['cs', 'en'])
        expect(service.resolveEndpointLocales(endpoint('queryCategory'), locales).toArray()).toEqual(['de'])
        expect(service.resolveEndpointLocales(endpoint('listEntity'), locales).toArray()).toEqual(['cs', 'de', 'en'])
    })

    test('Should read no schema for the system API', async () => {
        const locales: RestCatalogLocales = await service.getCatalogLocales(
            new RestConsoleDataPointer(connection, 'system', RestInstanceType.System)
        )
        expect(locales.all.isEmpty()).toBe(true)
    })
})
