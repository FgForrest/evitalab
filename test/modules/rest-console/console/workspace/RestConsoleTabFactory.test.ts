import { describe, expect, test, vi } from 'vitest'
import { RestConsoleTabFactory } from '@/modules/rest-console/console/workspace/service/RestConsoleTabFactory'
import { RestInstanceType } from '@/modules/database-driver/connector/rest/model/RestInstanceType'
import type { ConnectionService } from '@/modules/connection/service/ConnectionService'
import type { Connection } from '@/modules/connection/model/Connection'
import type { RestConsoleTabDefinition } from '@/modules/rest-console/console/workspace/model/RestConsoleTabDefinition'

// the tab component pulls in the keymap, which touches `document` at import time; the factory never renders it
vi.mock('@/modules/rest-console/console/component/RestConsole.vue', () => ({ default: {} }))

const connection: Connection = { id: 'c1', name: 'local' } as unknown as Connection
const factory: RestConsoleTabFactory = new RestConsoleTabFactory({
    getConnection: () => connection
} as unknown as ConnectionService)

describe('REST console tab factory', () => {
    test('Should restore params and data and never execute on open', () => {
        const tab: RestConsoleTabDefinition = factory.restoreFromJson(
            { connectionId: 'c1', catalogName: 'evita', instanceType: RestInstanceType.Catalog } as never,
            {
                operationId: 'queryProductLocalized',
                method: 'POST',
                pathTemplate: '/{locale}/Product/query',
                locale: 'en',
                parameters: { scope: ['LIVE'] },
                body: '{"require":{}}'
            } as never
        )
        expect(tab.title).toBe('evita')
        expect(tab.params.dataPointer.catalogName).toBe('evita')
        expect(tab.params.dataPointer.instanceType).toBe(RestInstanceType.Catalog)
        expect(tab.params.executeOnOpen).toBe(false)
        expect(tab.initialData?.toSerializable()).toEqual({
            operationId: 'queryProductLocalized',
            method: 'POST',
            pathTemplate: '/{locale}/Product/query',
            locale: 'en',
            parameters: { scope: ['LIVE'] },
            body: '{"require":{}}'
        })
    })

    test('Should restore an unknown operation as it is, so the console can fall back while keeping the body', () => {
        const tab: RestConsoleTabDefinition = factory.restoreFromJson(
            { catalogName: 'evita', instanceType: RestInstanceType.Catalog } as never,
            { operationId: 'queryRemovedCollection', body: '{"filterBy":{}}' } as never
        )
        expect(tab.initialData?.operationId).toBe('queryRemovedCollection')
        expect(tab.initialData?.body).toBe('{"filterBy":{}}')
    })

    test('Should restore a system tab without data', () => {
        const tab: RestConsoleTabDefinition = factory.restoreFromJson(
            { catalogName: 'system', instanceType: RestInstanceType.System } as never
        )
        expect(tab.title).toBe('system')
        expect(tab.initialData?.toSerializable()).toEqual({})
    })
})
