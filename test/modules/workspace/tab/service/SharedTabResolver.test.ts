import { test, expect, describe, vi } from 'vitest'
import { SharedTabResolver } from '@/modules/workspace/tab/service/SharedTabResolver'
import { TabFactoryRegistry } from '@/modules/workspace/tab/service/TabFactoryRegistry'
import type { TabFactory } from '@/modules/workspace/tab/service/TabFactory'
import { ShareTabObject } from '@/modules/workspace/tab/model/ShareTabObject'
import { TabType } from '@/modules/workspace/tab/model/TabType'
import type { TabParamsDto } from '@/modules/workspace/tab/model/TabParamsDto'
import type { TabDataDto } from '@/modules/workspace/tab/model/TabDataDto'
import type { AnyTabDefinition } from '@/modules/workspace/tab/model/TabDefinition'
import { ConnectionNotFoundError } from '@/modules/connection/exception/ConnectionNotFoundError'
import { InvalidConnectionInSharedTabError } from '@/modules/workspace/tab/error/InvalidConnectionInSharedTabError'

function createResolver(factory: Partial<TabFactory> & Pick<TabFactory, 'restoreFromJson'>,
                        tabType: TabType = TabType.MutationHistoryViewer): SharedTabResolver {
    const registry: TabFactoryRegistry = new TabFactoryRegistry()
    registry.register({
        tabType,
        restorable: true,
        ...factory
    } as TabFactory)
    return new SharedTabResolver(registry)
}

const tabParams: TabParamsDto = {
    connectionId: 'demo',
    connectionName: 'Demo',
    catalogName: 'evita'
} as unknown as TabParamsDto
const tabData: TabDataDto = { entityType: 'Product' } as unknown as TabDataDto

describe('SharedTabResolver', () => {
    test('resolves a shared tab through the factory contributed for its type', async () => {
        const restoredTab: AnyTabDefinition = {} as AnyTabDefinition
        const restoreFromJson = vi.fn().mockReturnValue(restoredTab)
        const resolver: SharedTabResolver = createResolver({ restoreFromJson })

        const resolved: AnyTabDefinition = await resolver.resolve(
            new ShareTabObject(TabType.MutationHistoryViewer, tabParams, tabData)
        )

        expect(resolved).toBe(restoredTab)
        expect(restoreFromJson).toHaveBeenCalledWith(tabParams, tabData)
    })

    test('resolves a shared tab created by an older evitaLab under a legacy tab type id', async () => {
        const restoredTab: AnyTabDefinition = {} as AnyTabDefinition
        const restoreFromJson = vi.fn().mockReturnValue(restoredTab)
        const resolver: SharedTabResolver = createResolver(
            { restoreFromJson, legacyTabTypeIds: ['data-grid', 'dataGrid'] },
            TabType.EntityViewer
        )

        expect(await resolver.resolve(new ShareTabObject('data-grid' as TabType, tabParams, tabData)))
            .toBe(restoredTab)
        expect(await resolver.resolve(new ShareTabObject('dataGrid' as TabType, tabParams, tabData)))
            .toBe(restoredTab)
    })

    test('offers connection troubleshooting when the shared connection does not exist', async () => {
        const restoredTab: AnyTabDefinition = {} as AnyTabDefinition
        const restoreFromJson = vi.fn()
            .mockImplementationOnce(() => {
                throw new ConnectionNotFoundError('demo')
            })
            .mockReturnValue(restoredTab)
        const resolver: SharedTabResolver = createResolver({ restoreFromJson })

        const error: unknown = await resolver
            .resolve(new ShareTabObject(TabType.MutationHistoryViewer, tabParams, tabData))
            .then(() => undefined, (e: unknown) => e)

        expect(error).toBeInstanceOf(InvalidConnectionInSharedTabError)
        const troubleshooterError: InvalidConnectionInSharedTabError = error as InvalidConnectionInSharedTabError
        expect(troubleshooterError.originalConnectionName).toEqual('Demo')

        expect(await troubleshooterError.troubleshooterCallback('other')).toBe(restoredTab)
        expect(restoreFromJson).toHaveBeenLastCalledWith(
            expect.objectContaining({ connectionId: 'other' }),
            tabData
        )
    })

    test('passes tab params without a connection to the factory untouched', async () => {
        // an externally built shared tab carries no connection; the factory resolves it against the
        // single connection of this instance, so the troubleshooter must never kick in
        const restoredTab: AnyTabDefinition = {} as AnyTabDefinition
        const restoreFromJson = vi.fn().mockReturnValue(restoredTab)
        const resolver: SharedTabResolver = createResolver({ restoreFromJson })
        const tabParamsWithoutConnection: TabParamsDto = { catalogName: 'evita' } as unknown as TabParamsDto

        const resolved: AnyTabDefinition = await resolver.resolve(
            new ShareTabObject(TabType.MutationHistoryViewer, tabParamsWithoutConnection, tabData)
        )

        expect(resolved).toBe(restoredTab)
        expect(restoreFromJson).toHaveBeenCalledWith(tabParamsWithoutConnection, tabData)
    })

    test('rejects a tab type no module contributed a factory for', async () => {
        const resolver: SharedTabResolver = createResolver({ restoreFromJson: vi.fn() })

        await expect(resolver.resolve(new ShareTabObject('somethingElse' as TabType, tabParams, tabData)))
            .rejects.toThrow(/Unsupported shared tab type 'somethingElse'/)
    })

    test('rejects a tab type whose factory cannot restore tabs', async () => {
        const restoreFromJson = vi.fn()
        const resolver: SharedTabResolver = createResolver(
            { restoreFromJson, restorable: false },
            TabType.ErrorViewer
        )

        await expect(resolver.resolve(new ShareTabObject(TabType.ErrorViewer, tabParams, tabData)))
            .rejects.toThrow(/Unsupported shared tab type 'errorViewer'/)
        expect(restoreFromJson).not.toHaveBeenCalled()
    })
})
