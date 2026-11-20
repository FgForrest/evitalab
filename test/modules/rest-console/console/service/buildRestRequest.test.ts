import { describe, expect, test } from 'vitest'
import catalogSpec from '../../fixtures/catalog-openapi.json'
import { buildRestOperationCatalog } from '@/modules/rest-console/console/service/buildRestOperationCatalog'
import { buildRestRequest } from '@/modules/rest-console/console/service/buildRestRequest'
import { RestInstanceType } from '@/modules/database-driver/connector/rest/model/RestInstanceType'
import type { RestOperationCatalog } from '@/modules/rest-console/console/model/RestOperationCatalog'
import type { RestOperation } from '@/modules/rest-console/console/model/RestOperation'
import type { RestRequest } from '@/modules/database-driver/connector/rest/model/RestRequest'

const catalog: RestOperationCatalog = buildRestOperationCatalog(catalogSpec, RestInstanceType.Catalog)

function operation(operationId: string): RestOperation {
    const found: RestOperation | undefined = catalog.findOperation(operationId)
    expect(found, operationId).toBeDefined()
    return found as RestOperation
}

describe('REST request builder', () => {
    test('Should substitute and encode path parameters', () => {
        const request: RestRequest = buildRestRequest(operation('getProductById'), undefined, { primaryKey: '1 /2' }, undefined)
        expect(request.path).toBe('/Product/get/1%20%2F2')
    })

    test('Should take the locale of a localized variant from the locale switch', () => {
        const request: RestRequest = buildRestRequest(
            operation('getProductByIdLocalized'),
            'en',
            { primaryKey: '107891', locale: 'cs' },
            undefined
        )
        expect(request.path).toBe('/en/Product/get/107891')
        expect(request.queryString).toBe('')
    })

    test('Should send the locale of a non-localized variant as a query parameter', () => {
        const request: RestRequest = buildRestRequest(
            operation('getProduct'),
            undefined,
            { primaryKey: '1', locale: 'en', dataInLocales: ['cs', 'de'] },
            undefined
        )
        expect(request.path).toBe('/Product/get')
        expect(request.queryString).toBe('primaryKey=1&dataInLocales=cs&dataInLocales=de&locale=en')
    })

    test('Should repeat the key of array parameters', () => {
        const request: RestRequest = buildRestRequest(operation('getProduct'), undefined, { scope: ['LIVE', 'ARCHIVED'] }, undefined)
        expect(request.pathWithQuery).toBe('/Product/get?scope=LIVE&scope=ARCHIVED')
    })

    test('Should omit unset, empty and unknown parameters', () => {
        const request: RestRequest = buildRestRequest(
            operation('getProduct'),
            undefined,
            { code: '', scope: [], attributeContent: ['', 'code'], bogus: 'x' },
            undefined
        )
        expect(request.queryString).toBe('attributeContent=code')
    })

    test('Should encode query values and keep free text as written', () => {
        const request: RestRequest = buildRestRequest(operation('getProduct'), undefined, { url: ' /en/a b&c ' }, undefined)
        expect(request.queryString).toBe('url=%20%2Fen%2Fa%20b%26c%20')
    })

    test('Should trim values of other kinds', () => {
        const request: RestRequest = buildRestRequest(operation('getProduct'), undefined, { primaryKey: ' 1 ' }, undefined)
        expect(request.queryString).toBe('primaryKey=1')
    })

    test('Should keep the placeholder of a path parameter without a value', () => {
        const request: RestRequest = buildRestRequest(operation('getProductByIdLocalized'), undefined, {}, undefined)
        expect(request.path).toBe('/{locale}/Product/get/{primaryKey}')
    })

    test('Should send the body only for operations accepting one, and only when not blank', () => {
        expect(buildRestRequest(operation('queryProduct'), undefined, {}, '{"a":1}').body).toBe('{"a":1}')
        expect(buildRestRequest(operation('queryProduct'), undefined, {}, '  \n ').body).toBeUndefined()
        expect(buildRestRequest(operation('getProductById'), undefined, { primaryKey: '1' }, '{"a":1}').body).toBeUndefined()
    })
})
