import { describe, expect, test } from 'vitest'
import catalogSpec from '../../fixtures/catalog-openapi.json'
import { buildRestOperationCatalog } from '@/modules/rest-console/console/service/buildRestOperationCatalog'
import {
    type InitialRestSelection,
    resolveInitialRestSelection
} from '@/modules/rest-console/console/service/resolveInitialRestSelection'
import { RestInstanceType } from '@/modules/database-driver/connector/rest/model/RestInstanceType'
import { RestConsoleTabData } from '@/modules/rest-console/console/workspace/model/RestConsoleTabData'
import type { RestOperationCatalog } from '@/modules/rest-console/console/model/RestOperationCatalog'

const catalog: RestOperationCatalog = buildRestOperationCatalog(catalogSpec, RestInstanceType.Catalog)

describe('REST console initial selection', () => {
    test('Should restore the localized variant with its locale', () => {
        const selection: InitialRestSelection = resolveInitialRestSelection(catalog, new RestConsoleTabData(
            'queryProductLocalized', 'POST', '/{locale}/Product/query', 'en', {}, '{"require":{}}'
        ))
        expect(selection.endpoint?.id).toBe('queryProduct')
        expect(selection.locale).toBe('en')
        expect(selection.body).toBe('{"require":{}}')
        expect(selection.unknownOperationId).toBeUndefined()
    })

    test('Should ignore a stored locale of a non-localized variant', () => {
        const selection: InitialRestSelection = resolveInitialRestSelection(catalog, new RestConsoleTabData(
            'getProduct', 'GET', '/Product/get', 'en', { primaryKey: '1' }
        ))
        expect(selection.endpoint?.id).toBe('getProduct')
        expect(selection.locale).toBeUndefined()
        expect(selection.parameters).toEqual({ primaryKey: '1' })
    })

    test('Should fall back to the first endpoint for an unknown operation and keep the body', () => {
        const selection: InitialRestSelection = resolveInitialRestSelection(catalog, new RestConsoleTabData(
            'queryRemovedCollection', 'POST', '/RemovedCollection/query', undefined, { scope: ['LIVE'] }, '{"filterBy":{}}'
        ))
        expect(selection.unknownOperationId).toBe('queryRemovedCollection')
        expect(selection.endpoint).toBe(catalog.endpoints.first())
        expect(selection.body).toBe('{"filterBy":{}}')
        expect(selection.parameters).toEqual({ scope: ['LIVE'] })
    })

    test('Should start on the first endpoint without tab data', () => {
        const selection: InitialRestSelection = resolveInitialRestSelection(catalog, new RestConsoleTabData())
        expect(selection.endpoint).toBe(catalog.endpoints.first())
        expect(selection.unknownOperationId).toBeUndefined()
        expect(selection.body).toBeUndefined()
    })
})
