import { describe, expect, test } from 'vitest'
import catalogSpec from '../../fixtures/catalog-openapi.json'
import systemSpec from '../../fixtures/system-openapi.json'
import { buildRestOperationCatalog } from '@/modules/rest-console/console/service/buildRestOperationCatalog'
import { RestInstanceType } from '@/modules/database-driver/connector/rest/model/RestInstanceType'
import { RestHttpMethod } from '@/modules/database-driver/connector/rest/model/RestHttpMethod'
import type { RestOperationCatalog } from '@/modules/rest-console/console/model/RestOperationCatalog'
import type { RestEndpoint } from '@/modules/rest-console/console/model/RestEndpoint'
import type { RestOperation } from '@/modules/rest-console/console/model/RestOperation'
import type { RestParameter } from '@/modules/rest-console/console/model/RestParameter'
import { RestParameterKind } from '@/modules/rest-console/console/model/RestParameterKind'
import { RestParameterLocation } from '@/modules/rest-console/console/model/RestParameterLocation'

/**
 * The fixtures are the real specifications of a local evitaDB (demo dataset), trimmed to the `Product` and
 * `Category` collections plus the catalog-level paths; component schemas other than the enums are stubbed.
 */

const catalog: RestOperationCatalog = buildRestOperationCatalog(catalogSpec, RestInstanceType.Catalog)

function endpoint(id: string): RestEndpoint {
    const found: RestEndpoint | undefined = catalog.findEndpoint(id)
    expect(found, `endpoint ${id}`).toBeDefined()
    return found as RestEndpoint
}

function parameter(operation: RestOperation | undefined, name: string): RestParameter {
    const found: RestParameter | undefined = operation?.parameters.find(it => it.name === name)
    expect(found, `parameter ${name}`).toBeDefined()
    return found as RestParameter
}

describe('REST operation catalog', () => {
    test('Should group by collection and put the catalog group last', () => {
        expect(catalog.groups.map(group => group.name).toArray()).toEqual(['Category', 'Product', 'catalog'])
        expect(catalog.groups.last()?.generic).toBe(true)
    })

    test('Should exclude the specification itself and the change capture stream', () => {
        const paths: string[] = catalog.endpoints
            .flatMap(it => [it.nonLocalized?.pathTemplate, it.localized?.pathTemplate])
            .filter(it => it != undefined)
            .toArray() as string[]
        expect(paths).not.toContain('/')
        expect(paths).not.toContain('/change-captures')
    })

    test('Should merge localized twins into one endpoint', () => {
        const query: RestEndpoint = endpoint('queryProduct')
        expect(query.nonLocalized?.operationId).toBe('queryProduct')
        expect(query.localized?.operationId).toBe('queryProductLocalized')
        expect(query.localized?.pathTemplate).toBe('/{locale}/Product/query')
        expect(catalog.findEndpoint('queryProductLocalized')).toBeUndefined()
        expect(catalog.findEndpointOfOperation('queryProductLocalized')).toBe(query)
    })

    test('Should merge the lower-case entity twins too', () => {
        const listEntity: RestEndpoint = endpoint('listEntity')
        expect(listEntity.groupName).toBe('catalog')
        expect(listEntity.localized?.operationId).toBe('listEntityLocalized')
    })

    test('Should keep the own parameters of each variant', () => {
        const getById: RestEndpoint = endpoint('getProductById')
        const localizedLocale: RestParameter = parameter(getById.localized, 'locale')
        expect(localizedLocale.location).toBe(RestParameterLocation.Path)
        expect(getById.localized?.parameters.first()?.name).toBe('locale')

        const get: RestEndpoint = endpoint('getProduct')
        expect(parameter(get.nonLocalized, 'locale').location).toBe(RestParameterLocation.Query)
        expect(parameter(get.nonLocalized, 'dataInLocales').location).toBe(RestParameterLocation.Query)
        expect(get.localized?.parameters.some(it => it.name === 'dataInLocales')).toBe(false)
    })

    test('Should order the endpoints of a collection by operation', () => {
        const product = catalog.groups.find(group => group.name === 'Product')
        expect(product?.endpoints.map(it => it.operationKey).toArray()).toEqual([
            'query', 'list', 'get', 'getById', 'upsert', 'delete', 'deleteByQuery', 'getSchema', 'updateSchema'
        ])
    })

    test('Should derive operation keys of catalog-level endpoints from the raw operation id', () => {
        const catalogGroup = catalog.groups.find(group => group.name === 'catalog')
        expect(catalogGroup?.endpoints.map(it => it.operationKey).toArray()).toEqual([
            'getEntity', 'listEntity', 'collections', 'getCatalogSchema', 'updateCatalogSchema'
        ])
    })

    test('Should resolve parameter kinds', () => {
        const get: RestOperation | undefined = endpoint('getProduct').nonLocalized
        expect(parameter(get, 'primaryKey').kind).toBe(RestParameterKind.Integer)
        expect(parameter(get, 'primaryKey').displayType).toBe('int32')
        expect(parameter(get, 'priceInCurrency').kind).toBe(RestParameterKind.Enum)
        expect(parameter(get, 'priceInCurrency').enumValues.toArray()).toEqual(['EUR', 'CZK'])
        expect(parameter(get, 'priceInPriceLists').kind).toBe(RestParameterKind.StringArray)
        expect(parameter(get, 'priceValidIn').kind).toBe(RestParameterKind.DateTime)
        expect(parameter(get, 'priceValidInNow').kind).toBe(RestParameterKind.Boolean)
        expect(parameter(get, 'scope').kind).toBe(RestParameterKind.EnumArray)
        expect(parameter(get, 'scope').displayType).toBe('array<Scope>')
        expect(parameter(get, 'code').kind).toBe(RestParameterKind.String)
        expect(parameter(get, 'primaryKey').required).toBe(false)
    })

    test('Should prefer the locale format over the enum of a locale parameter', () => {
        const get: RestOperation | undefined = endpoint('getProduct').nonLocalized
        expect(parameter(get, 'locale').kind).toBe(RestParameterKind.Locale)
        expect(parameter(get, 'locale').enumValues.toArray()).toEqual(['cs', 'de', 'en'])
        expect(parameter(get, 'dataInLocales').kind).toBe(RestParameterKind.LocaleArray)

        const listEntity: RestOperation | undefined = endpoint('listEntity').nonLocalized
        expect(parameter(listEntity, 'locale').kind).toBe(RestParameterKind.Locale)
        expect(parameter(listEntity, 'dataInLocales').kind).toBe(RestParameterKind.LocaleArray)
        expect(parameter(listEntity, 'filterJoin').kind).toBe(RestParameterKind.Enum)
    })

    test('Should mark path parameters as required', () => {
        expect(parameter(endpoint('getProductById').nonLocalized, 'primaryKey').required).toBe(true)
    })

    test('Should recognize bodies and queries', () => {
        const query: RestEndpoint = endpoint('queryProduct')
        expect(query.hasBody).toBe(true)
        expect(query.localized?.bodySchemaName).toBe('ProductLocalizedQueryRequestBody')
        expect(query.primary.isQuery).toBe(true)
        expect(endpoint('listProduct').primary.isQuery).toBe(false)
        expect(endpoint('getProductById').hasBody).toBe(false)
        expect(endpoint('deleteProductByQuery').method).toBe(RestHttpMethod.Delete)
        expect(endpoint('deleteProductByQuery').hasBody).toBe(true)
    })

    test('Should put the whole system API into a single group', () => {
        const system: RestOperationCatalog = buildRestOperationCatalog(systemSpec, RestInstanceType.System)
        expect(system.groups.map(group => group.name).toArray()).toEqual(['system'])
        expect(system.endpoints.map(it => it.id).toArray()).toEqual([
            'listCatalogs', 'getCatalog', 'createCatalog', 'updateCatalog', 'deleteCatalog', 'liveness'
        ])
        const updateCatalog: RestEndpoint | undefined = system.findEndpoint('updateCatalog')
        expect(updateCatalog?.method).toBe(RestHttpMethod.Patch)
        expect(updateCatalog?.hasBody).toBe(true)
        expect(updateCatalog?.collectionName).toBeUndefined()
    })
})
