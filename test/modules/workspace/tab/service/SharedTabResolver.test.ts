import { test, expect, describe, vi } from 'vitest'

// every tab definition eagerly imports its Vue component, so the real factory modules cannot be loaded
// in a plain Node test environment; the resolver only needs the class names from them
vi.mock('@/modules/entity-viewer/viewer/workspace/service/EntityViewerTabFactory', () => ({ EntityViewerTabFactory: class {} }))
vi.mock('@/modules/evitaql-console/console/workspace/service/EvitaQLConsoleTabFactory', () => ({ EvitaQLConsoleTabFactory: class {} }))
vi.mock('@/modules/graphql-console/console/workspace/service/GraphQLConsoleTabFactory', () => ({ GraphQLConsoleTabFactory: class {} }))
vi.mock('@/modules/schema-viewer/viewer/workspace/service/SchemaViewerTabFactory', () => ({ SchemaViewerTabFactory: class {} }))
vi.mock('@/modules/traffic-viewer/service/TrafficRecordHistoryViewerTabFactory', () => ({ TrafficRecordHistoryViewerTabFactory: class {} }))
vi.mock('@/modules/history-viewer/service/MutationHistoryViewerTabFactory', () => ({ MutationHistoryViewerTabFactory: class {} }))

import { SharedTabResolver } from '@/modules/workspace/tab/service/SharedTabResolver'
import { ShareTabObject } from '@/modules/workspace/tab/model/ShareTabObject'
import { TabType } from '@/modules/workspace/tab/model/TabType'
import type { TabParamsDto } from '@/modules/workspace/tab/model/TabParamsDto'
import type { TabDataDto } from '@/modules/workspace/tab/model/TabDataDto'
import type { AnyTabDefinition } from '@/modules/workspace/tab/model/TabDefinition'
import { ConnectionNotFoundError } from '@/modules/connection/exception/ConnectionNotFoundError'
import { InvalidConnectionInSharedTabError } from '@/modules/workspace/tab/error/InvalidConnectionInSharedTabError'
import type {
    MutationHistoryViewerTabFactory
} from '@/modules/history-viewer/service/MutationHistoryViewerTabFactory'
import type { EntityViewerTabFactory } from '@/modules/entity-viewer/viewer/workspace/service/EntityViewerTabFactory'
import type {
    EvitaQLConsoleTabFactory
} from '@/modules/evitaql-console/console/workspace/service/EvitaQLConsoleTabFactory'
import type {
    GraphQLConsoleTabFactory
} from '@/modules/graphql-console/console/workspace/service/GraphQLConsoleTabFactory'
import type { SchemaViewerTabFactory } from '@/modules/schema-viewer/viewer/workspace/service/SchemaViewerTabFactory'
import type {
    TrafficRecordHistoryViewerTabFactory
} from '@/modules/traffic-viewer/service/TrafficRecordHistoryViewerTabFactory'

const unusableFactory: never = new Proxy({}, {
    get(): never {
        throw new Error('Unexpected factory usage')
    }
}) as never

function createResolver(mutationHistoryViewerTabFactory: MutationHistoryViewerTabFactory): SharedTabResolver {
    return new SharedTabResolver(
        unusableFactory as EntityViewerTabFactory,
        unusableFactory as EvitaQLConsoleTabFactory,
        unusableFactory as GraphQLConsoleTabFactory,
        unusableFactory as SchemaViewerTabFactory,
        unusableFactory as TrafficRecordHistoryViewerTabFactory,
        mutationHistoryViewerTabFactory
    )
}

const tabParams: TabParamsDto = {
    connectionId: 'demo',
    connectionName: 'Demo',
    catalogName: 'evita'
} as unknown as TabParamsDto
const tabData: TabDataDto = { entityType: 'Product' } as unknown as TabDataDto

describe('SharedTabResolver mutation history viewer', () => {
    test('resolves a shared mutation history viewer tab through its factory', async () => {
        const restoredTab: AnyTabDefinition = {} as AnyTabDefinition
        const restoreFromJson = vi.fn().mockReturnValue(restoredTab)
        const resolver: SharedTabResolver = createResolver(
            { restoreFromJson } as unknown as MutationHistoryViewerTabFactory
        )

        const resolved: AnyTabDefinition = await resolver.resolve(
            new ShareTabObject(TabType.MutationHistoryViewer, tabParams, tabData)
        )

        expect(resolved).toBe(restoredTab)
        expect(restoreFromJson).toHaveBeenCalledWith(tabParams, tabData)
    })

    test('offers connection troubleshooting when the shared connection does not exist', async () => {
        const restoredTab: AnyTabDefinition = {} as AnyTabDefinition
        const restoreFromJson = vi.fn()
            .mockImplementationOnce(() => {
                throw new ConnectionNotFoundError('demo')
            })
            .mockReturnValue(restoredTab)
        const resolver: SharedTabResolver = createResolver(
            { restoreFromJson } as unknown as MutationHistoryViewerTabFactory
        )

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
        const resolver: SharedTabResolver = createResolver(
            { restoreFromJson } as unknown as MutationHistoryViewerTabFactory
        )
        const tabParamsWithoutConnection: TabParamsDto = { catalogName: 'evita' } as unknown as TabParamsDto

        const resolved: AnyTabDefinition = await resolver.resolve(
            new ShareTabObject(TabType.MutationHistoryViewer, tabParamsWithoutConnection, tabData)
        )

        expect(resolved).toBe(restoredTab)
        expect(restoreFromJson).toHaveBeenCalledWith(tabParamsWithoutConnection, tabData)
    })

    test('rejects a tab type that is not shareable', async () => {
        const resolver: SharedTabResolver = createResolver(unusableFactory as MutationHistoryViewerTabFactory)

        await expect(resolver.resolve(new ShareTabObject('somethingElse' as TabType, tabParams, tabData)))
            .rejects.toThrow(/Unsupported shared tab type 'somethingElse'/)
    })
})
