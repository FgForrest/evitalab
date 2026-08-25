import { test, expect, describe, vi } from 'vitest'
import { WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import { TabFactoryRegistry } from '@/modules/workspace/tab/service/TabFactoryRegistry'
import type { TabFactory } from '@/modules/workspace/tab/service/TabFactory'
import { StoredTabObject } from '@/modules/workspace/tab/model/StoredTabObject'
import { TabType } from '@/modules/workspace/tab/model/TabType'
import type { TabParamsDto } from '@/modules/workspace/tab/model/TabParamsDto'
import type { AnyTabDefinition } from '@/modules/workspace/tab/model/TabDefinition'
import type { WorkspaceStore } from '@/modules/workspace/store/workspaceStore'
import { LabStorage } from '@/modules/storage/LabStorage'
import { EvitaLabConfig } from '@/modules/config/EvitaLabConfig'

/**
 * Tab type ids of sessions persisted by older evitaLab versions that must still be restorable.
 * Mirrors the legacy ids declared by the production tab factories.
 */
const legacyTabTypeIds: Map<TabType, string[]> = new Map([
    [TabType.EntityViewer, ['data-grid', 'dataGrid']],
    [TabType.EvitaQLConsole, ['evitaql-console']],
    [TabType.GraphQLConsole, ['graphql-console']],
    [TabType.SchemaViewer, ['schema-viewer']],
    [TabType.ServerViewer, ['serverStatus']]
])

const tabParams: TabParamsDto = { connectionId: 'demo', catalogName: 'evita' } as unknown as TabParamsDto

function createTabDefinition(tabType: TabType): AnyTabDefinition {
    return {
        id: `${tabType}-tab`,
        tabType,
        new: true,
        initialData: undefined,
        params: { toSerializable: () => tabParams }
    } as unknown as AnyTabDefinition
}

function createRegistry(restorableTabTypes: TabType[] = Object.values(TabType)): TabFactoryRegistry {
    const registry: TabFactoryRegistry = new TabFactoryRegistry()
    Object.values(TabType).forEach(tabType => registry.register({
        tabType,
        legacyTabTypeIds: legacyTabTypeIds.get(tabType),
        restorable: restorableTabTypes.includes(tabType),
        restoreFromJson: () => createTabDefinition(tabType)
    } as TabFactory))
    return registry
}

function createStore(): WorkspaceStore {
    return {
        tabDefinitions: [],
        tabData: new Map(),
        tabHistory: new Map(),
        selectedTabId: undefined
    } as unknown as WorkspaceStore
}

function createLabStorage(storedValues: Map<string, unknown>): LabStorage {
    return {
        get: (key: string, defaultValue?: unknown) => storedValues.has(key) ? storedValues.get(key) : defaultValue,
        set: (key: string, value: unknown) => storedValues.set(key, value),
        remove: (key: string) => storedValues.delete(key)
    } as unknown as LabStorage
}

function createWorkspaceService(storedValues: Map<string, unknown>,
                                registry: TabFactoryRegistry): WorkspaceService {
    return new WorkspaceService(
        { playgroundMode: false } as unknown as EvitaLabConfig,
        createStore(),
        createLabStorage(storedValues),
        registry
    )
}

function storeTabs(storedValues: Map<string, unknown>, tabTypeIds: string[]): void {
    storedValues.set(
        'openedTabs',
        tabTypeIds.map(tabTypeId => new StoredTabObject(
            tabTypeId as TabType,
            tabParams,
            undefined as never
        ).toSerializable())
    )
}

describe('restoring tabs of the last session', () => {
    test('restores every tab type through the factory contributed for it', () => {
        const storedValues: Map<string, unknown> = new Map()
        storeTabs(storedValues, Object.values(TabType))
        const workspaceService: WorkspaceService = createWorkspaceService(storedValues, createRegistry())

        workspaceService.restoreTabsFromLastSession()

        expect(workspaceService.getTabDefinitions().map(it => it.tabType))
            .toEqual(Object.values(TabType))
    })

    test.each([...legacyTabTypeIds].flatMap(([tabType, legacyIds]) =>
        legacyIds.map(legacyId => [legacyId, tabType] as [string, TabType])
    ))(
        'restores a tab persisted under the legacy id %s',
        (legacyTabTypeId: string, tabType: TabType) => {
            const storedValues: Map<string, unknown> = new Map()
            storeTabs(storedValues, [legacyTabTypeId])
            const workspaceService: WorkspaceService = createWorkspaceService(storedValues, createRegistry())

            workspaceService.restoreTabsFromLastSession()

            expect(workspaceService.getTabDefinitions().map(it => it.tabType)).toEqual([tabType])
        }
    )

    test('rejects a stored tab type no module contributed a factory for', () => {
        const storedValues: Map<string, unknown> = new Map()
        storeTabs(storedValues, ['somethingElse'])
        const workspaceService: WorkspaceService = createWorkspaceService(storedValues, createRegistry())

        expect(() => workspaceService.restoreTabsFromLastSession())
            .toThrow(/Unsupported stored tab type 'somethingElse'/)
    })

    // every tab type is restorable today, so the opt-out is exercised against an arbitrary one
    test('rejects a stored tab type whose factory cannot restore tabs', () => {
        const storedValues: Map<string, unknown> = new Map()
        storeTabs(storedValues, [TabType.EntityViewer])
        const workspaceService: WorkspaceService = createWorkspaceService(
            storedValues,
            createRegistry(Object.values(TabType).filter(it => it !== TabType.EntityViewer))
        )

        expect(() => workspaceService.restoreTabsFromLastSession())
            .toThrow(/Unsupported stored tab type 'entityViewer'/)
    })
})

describe('storing opened tabs', () => {
    test('persists tabs under the canonical type of their definition', () => {
        const storedValues: Map<string, unknown> = new Map()
        const workspaceService: WorkspaceService = createWorkspaceService(storedValues, createRegistry())
        workspaceService.createTab(createTabDefinition(TabType.EntityViewer))

        const storedTabs: string[] = storedValues.get('openedTabs') as string[]
        expect(storedTabs.map(it => StoredTabObject.restoreFromSerializable(it).tabType))
            .toEqual([TabType.EntityViewer])
    })

    test('persists the error viewer, whose params carry a serializable error summary', () => {
        const storedValues: Map<string, unknown> = new Map()
        const workspaceService: WorkspaceService = createWorkspaceService(storedValues, createRegistry())
        workspaceService.createTab(createTabDefinition(TabType.ErrorViewer))

        const storedTabs: string[] = storedValues.get('openedTabs') as string[]
        expect(storedTabs.map(it => StoredTabObject.restoreFromSerializable(it).tabType))
            .toEqual([TabType.ErrorViewer])
    })

    // every tab type is restorable today, so the opt-out is exercised against an arbitrary one
    test('skips tabs whose factory cannot restore them', () => {
        vi.spyOn(console, 'info').mockImplementation(() => undefined)
        const storedValues: Map<string, unknown> = new Map()
        const workspaceService: WorkspaceService = createWorkspaceService(
            storedValues,
            createRegistry(Object.values(TabType).filter(it => it !== TabType.SchemaViewer))
        )
        workspaceService.createTab(createTabDefinition(TabType.SchemaViewer))
        workspaceService.createTab(createTabDefinition(TabType.EntityViewer))

        const storedTabs: string[] = storedValues.get('openedTabs') as string[]
        expect(storedTabs.map(it => StoredTabObject.restoreFromSerializable(it).tabType))
            .toEqual([TabType.EntityViewer])
    })
})
