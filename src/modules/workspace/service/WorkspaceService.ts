import type { InjectionKey } from 'vue'
import LZString from 'lz-string'
import type { WorkspaceStore } from '@/modules/workspace/store/workspaceStore'
import type { AnyTabDefinition } from '@/modules/workspace/tab/model/TabDefinition'
import type { AnyTabData } from '@/modules/workspace/tab/model/TabData'
import { LabStorage } from '@/modules/storage/LabStorage'
import { TabType } from '@/modules/workspace/tab/model/TabType'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { StoredTabObject } from '@/modules/workspace/tab/model/StoredTabObject'
import { TabHistoryKey } from '@/modules/workspace/tab/model/TabHistoryKey'
import { GraphQLConsoleTabFactory } from '@/modules/graphql-console/console/workspace/service/GraphQLConsoleTabFactory'
import { GraphQLConsoleTabDefinition } from '@/modules/graphql-console/console/workspace/model/GraphQLConsoleTabDefinition'
import { EntityViewerTabFactory } from '@/modules/entity-viewer/viewer/workspace/service/EntityViewerTabFactory'
import { EvitaQLConsoleTabFactory } from '@/modules/evitaql-console/console/workspace/service/EvitaQLConsoleTabFactory'
import { SchemaViewerTabFactory } from '@/modules/schema-viewer/viewer/workspace/service/SchemaViewerTabFactory'
import { KeymapViewerTabFactory } from '@/modules/keymap/viewer/workspace/service/KeymapViewerTabFactory'
import { EntityViewerTabDefinition } from '@/modules/entity-viewer/viewer/workspace/model/EntityViewerTabDefinition'
import { EvitaQLConsoleTabDefinition } from '@/modules/evitaql-console/console/workspace/model/EvitaQLConsoleTabDefinition'
import { SchemaViewerTabDefinition } from '@/modules/schema-viewer/viewer/workspace/model/SchemaViewerTabDefinition'
import { KeymapViewerTabDefinition } from '@/modules/keymap/viewer/workspace/model/KeymapViewerTabDefinition'
import { mandatoryInject } from '@/utils/reactivity'
import { ServerViewerTabFactory } from '@/modules/server-viewer/service/ServerViewerTabFactory'
import { ServerViewerTabDefinition } from '@/modules/server-viewer/model/ServerViewerTabDefinition'
import { TaskViewerTabFactory } from '@/modules/task-viewer/services/TaskViewerTabFactory'
import { TaskViewerTabDefinition } from '@/modules/task-viewer/model/TaskViewerTabDefinition'
import { BackupViewerTabDefinition } from '@/modules/backup-viewer/model/BackupViewerTabDefinition'
import { JfrViewerTabDefinition } from '@/modules/jfr-viewer/model/JfrViewerTabDefinition'
import { BackupViewerTabFactory } from '@/modules/backup-viewer/service/BackupViewerTabFactory'
import { JfrViewerTabFactory } from '@/modules/jfr-viewer/service/JfrViewerTabFactory'
import { SubjectPathStatus } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPathStatus'
import { EditorStatus } from '@/modules/workspace/status-bar/model/editor-status/EditorStatus'
import { TrafficRecordingsViewerTabDefinition } from '@/modules/traffic-viewer/model/TrafficRecordingsViewerTabDefinition'
import { TrafficRecordingsViewerTabFactory } from '@/modules/traffic-viewer/service/TrafficRecordingsViewerTabFactory'
import { TrafficRecordHistoryViewerTabDefinition } from '@/modules/traffic-viewer/model/TrafficRecordHistoryViewerTabDefinition'
import { TrafficRecordHistoryViewerTabFactory } from '@/modules/traffic-viewer/service/TrafficRecordHistoryViewerTabFactory'
import { EvitaLabConfig } from '@/modules/config/EvitaLabConfig'
import type { MutationHistoryViewerTabFactory } from '@/modules/history-viewer/service/MutationHistoryViewerTabFactory.ts'
import { MutationHistoryViewerTabDefinition } from '@/modules/history-viewer/model/MutationHistoryViewerTabDefinition.ts'
import { ErrorViewerTabDefinition } from '@/modules/error-viewer/viewer/workspace/model/ErrorViewerTabDefinition'
import type { ErrorViewerTabFactory } from '@/modules/error-viewer/viewer/workspace/service/ErrorViewerTabFactory'

const openedTabsStorageKey: string = 'openedTabs'
const selectedTabStorageKey: string = 'selectedTab'
const tabHistoryStorageKey: string = 'tabHistory'

export const workspaceServiceInjectionKey: InjectionKey<WorkspaceService> = Symbol('workspaceService')

/**
 * Handles lifecycle of the entire workspace. Mainly, it handles creation and destruction of tabs.
 */
export class WorkspaceService {
    private readonly evitaLabConfig: EvitaLabConfig
    private readonly store: WorkspaceStore
    private readonly labStorage: LabStorage

    private readonly entityViewerTabFactory: EntityViewerTabFactory
    private readonly evitaQLConsoleTabFactory: EvitaQLConsoleTabFactory
    private readonly graphQLConsoleTabFactory: GraphQLConsoleTabFactory
    private readonly schemaViewerTabFactory: SchemaViewerTabFactory
    private readonly keymapViewerTabFactory: KeymapViewerTabFactory
    private readonly serverViewerTabFactory: ServerViewerTabFactory
    private readonly taskViewerTabFactory: TaskViewerTabFactory
    private readonly backupViewerTabFactory: BackupViewerTabFactory
    private readonly jfrViewerTabFactory: JfrViewerTabFactory
    private readonly trafficRecordingsViewerTabFactory: TrafficRecordingsViewerTabFactory
    private readonly trafficRecordHistoryViewerTabFactory: TrafficRecordHistoryViewerTabFactory
    readonly mutationHistoryViewerTabFactory: MutationHistoryViewerTabFactory
    private readonly errorViewerTabFactory: ErrorViewerTabFactory

    constructor(evitaLabConfig: EvitaLabConfig,
                store: WorkspaceStore,
                labStorage: LabStorage,
                entityViewerTabFactory: EntityViewerTabFactory,
                evitaQLConsoleTabFactory: EvitaQLConsoleTabFactory,
                graphQLConsoleTabFactory: GraphQLConsoleTabFactory,
                schemaViewerTabFactory: SchemaViewerTabFactory,
                keymapViewerTabFactory: KeymapViewerTabFactory,
                serverViewerTabFactory: ServerViewerTabFactory,
                taskViewerTabFactory: TaskViewerTabFactory,
                backupViewerTabFactory: BackupViewerTabFactory,
                jfrViewerTabFactory: JfrViewerTabFactory,
                trafficRecordingsViewerTabFactory: TrafficRecordingsViewerTabFactory,
                trafficRecordHistoryViewerTabFactory: TrafficRecordHistoryViewerTabFactory,
                historyViewerTabFactory: MutationHistoryViewerTabFactory,
                errorViewerTabFactory: ErrorViewerTabFactory
    ) {
        this.evitaLabConfig = evitaLabConfig
        this.store = store
        this.labStorage = labStorage
        this.entityViewerTabFactory = entityViewerTabFactory
        this.evitaQLConsoleTabFactory = evitaQLConsoleTabFactory
        this.graphQLConsoleTabFactory = graphQLConsoleTabFactory
        this.schemaViewerTabFactory = schemaViewerTabFactory
        this.keymapViewerTabFactory = keymapViewerTabFactory
        this.serverViewerTabFactory = serverViewerTabFactory
        this.taskViewerTabFactory = taskViewerTabFactory
        this.backupViewerTabFactory = backupViewerTabFactory
        this.jfrViewerTabFactory = jfrViewerTabFactory
        this.trafficRecordingsViewerTabFactory = trafficRecordingsViewerTabFactory
        this.trafficRecordHistoryViewerTabFactory = trafficRecordHistoryViewerTabFactory
        this.mutationHistoryViewerTabFactory = historyViewerTabFactory
        this.errorViewerTabFactory = errorViewerTabFactory
    }

    getTabDefinitions(): AnyTabDefinition[] {
        return this.store.tabDefinitions
    }

    getTabDefinition(id: string): AnyTabDefinition | undefined {
        return this.getTabDefinitions().find(it => it.id === id)
    }

    getTabIndex(id: string): number {
        return this.getTabDefinitions().findIndex(it => it.id === id)
    }

    /**
     * Finds newly created tab that hasn't been marked as visited yet.
     */
    getTheNewTab(): AnyTabDefinition | undefined {
        return this.getTabDefinitions().find(it => it.new)
    }

    /**
     * Create new tab from definition
     */
    createTab(tabDefinition: AnyTabDefinition): void {
        // tab definitions may share static ID to indicate only one such tab can be opened at a time
        const tabRequestWithSameId: AnyTabDefinition | undefined = this.getTabDefinition(tabDefinition.id)
        if (tabRequestWithSameId == undefined) {
            this.store.tabDefinitions.push(tabDefinition)
            this.store.tabData.set(tabDefinition.id, tabDefinition.initialData)
        }
        this.storeOpenedTabs()
    }

    markTabAsVisited(tabId: string): void {
        const tabDefinition: AnyTabDefinition | undefined = this.getTabDefinition(tabId)
        if (tabDefinition) {
            tabDefinition.new = false
        }
    }

    /**
     * Returns id of the tab the user currently works with, if there is any.
     */
    getSelectedTabId(): string | undefined {
        return this.store.selectedTabId
    }

    /**
     * Marks the tab as the one the user currently works with, so that it can be selected again in the next session.
     * @param tabId id of the selected tab, or undefined if no tab is selected anymore
     */
    markTabAsSelected(tabId: string | undefined): void {
        this.store.selectedTabId = tabId
        this.storeOpenedTabs()
    }

    /**
     * Replace tab data with new ones
     *@param tabId
     * @param updatedData
     */
    replaceTabData(tabId: string, updatedData: AnyTabData): void {
        this.store.tabData.set(tabId, updatedData)
        this.storeOpenedTabs()
    }

    destroyTab(tabId: string): void {
        this.store.tabDefinitions.splice(
            this.store.tabDefinitions.findIndex(tabRequest => tabRequest.id === tabId),
            1
        )
        this.store.tabData.delete(tabId)
        this.storeOpenedTabs()
    }

    destroyAllTabs(): void {
        this.store.tabDefinitions.splice(0)
        this.store.tabData.clear()
        this.store.selectedTabId = undefined
        this.storeOpenedTabs()
    }

    /**
     * Restores last stored tab from lab storage. The tab selected in the last session, if it is still among
     * the restored ones, is marked as selected again.
     * @return whether any tab data were restored
     */
    restoreTabsFromLastSession(): boolean {
        const lastOpenedTabs: StoredTabObject[] = this.labStorage.get(openedTabsStorageKey, [])
            .map((it: string) => StoredTabObject.restoreFromSerializable(it))
        const lastSelectedTabIndex: number = this.labStorage.get(selectedTabStorageKey, -1)
        this.labStorage.remove(openedTabsStorageKey)
        this.labStorage.remove(selectedTabStorageKey)
        if (lastOpenedTabs.length === 0) {
            return false
        }

        let restoredTabsDataCount: number = 0
        const restoredTabDefinitions: AnyTabDefinition[] = lastOpenedTabs
            .map(storedTabObject => {
                switch (storedTabObject.tabType as string) {
                    case 'data-grid':
                    case 'dataGrid':
                    case TabType.EntityViewer:
                        return this.entityViewerTabFactory.restoreFromJson(storedTabObject.tabParams, storedTabObject.tabData)
                    case 'evitaql-console':
                    case TabType.EvitaQLConsole:
                        return this.evitaQLConsoleTabFactory.restoreFromJson(storedTabObject.tabParams, storedTabObject.tabData)
                    case 'graphql-console':
                    case TabType.GraphQLConsole:
                        return this.graphQLConsoleTabFactory.restoreFromJson(storedTabObject.tabParams, storedTabObject.tabData)
                    case 'schema-viewer':
                    case TabType.SchemaViewer:
                        return this.schemaViewerTabFactory.restoreFromJson(storedTabObject.tabParams)
                    case TabType.KeymapViewer:
                        return this.keymapViewerTabFactory.createNew()
                    case 'serverStatus':
                    case TabType.ServerViewer:
                        return this.serverViewerTabFactory.restoreFromJson(storedTabObject.tabParams)
                    case TabType.TaskViewer:
                        return this.taskViewerTabFactory.restoreFromJson(storedTabObject.tabParams)
                    case TabType.BackupViewer:
                        return this.backupViewerTabFactory.restoreFromJson(storedTabObject.tabParams)
                    case TabType.JfrViewer:
                        return this.jfrViewerTabFactory.restoreFromJson(storedTabObject.tabParams)
                    case TabType.TrafficRecordingsViewer:
                        return this.trafficRecordingsViewerTabFactory.restoreFromJson(storedTabObject.tabParams)
                    case TabType.TrafficRecordHistoryViewer:
                        return this.trafficRecordHistoryViewerTabFactory.restoreFromJson(storedTabObject.tabParams, storedTabObject.tabData)
                    case TabType.MutationHistoryViewer:
                        return this.mutationHistoryViewerTabFactory.restoreFromJson(storedTabObject.tabParams, storedTabObject.tabData)
                    case TabType.ErrorViewer:
                        return this.errorViewerTabFactory.restoreFromJson(storedTabObject.tabParams)
                    default:
                        throw new UnexpectedError(`Unsupported stored tab type '${storedTabObject.tabType}'.`)
                }
            })

        restoredTabDefinitions.forEach(tabDefinition => {
            // restored tabs were already visited by the user in the last session, only the previously selected
            // one is activated below
            tabDefinition.new = false
            if (tabDefinition.initialData != undefined) {
                this.store.tabData.set(tabDefinition.id, tabDefinition.initialData)
                restoredTabsDataCount++
            }
            this.createTab(tabDefinition)
        })

        const lastSelectedTab: AnyTabDefinition | undefined = restoredTabDefinitions[lastSelectedTabIndex]
        if (lastSelectedTab != undefined && this.getTabDefinition(lastSelectedTab.id) != undefined) {
            this.markTabAsSelected(lastSelectedTab.id)
        }

        return restoredTabsDataCount > 0
    }

    /**
     * Stores current tabs and index of the currently selected tab into lab storage
     */
    storeOpenedTabs(): void {
        if (this.evitaLabConfig.playgroundMode) {
            return
        }

        const selectedTabId: string | undefined = this.store.selectedTabId
        let selectedTabIndex: number = -1
        const tabsToStore: string[] = []
        for (const tabRequest of this.getTabDefinitions()) {
            const tabType: TabType | undefined = WorkspaceService.resolveStorableTabType(tabRequest)
            if (tabType == undefined) {
                console.info(undefined, `Unsupported tab type '${tabRequest.constructor.name}'. Not storing for next session.`)
                continue
            }

            // the index must point into the stored tabs, not into all opened ones, because unsupported tabs are skipped
            if (tabRequest.id === selectedTabId) {
                selectedTabIndex = tabsToStore.length
            }

            const tabData: AnyTabData | undefined = this.store.tabData.get(tabRequest.id)
            tabsToStore.push(
                new StoredTabObject(
                    tabType,
                    tabRequest.params.toSerializable(),
                    tabData != undefined ? tabData.toSerializable() : undefined
                ).toSerializable()
            )
        }

        this.labStorage.set(openedTabsStorageKey, tabsToStore)
        if (selectedTabIndex < 0) {
            this.labStorage.remove(selectedTabStorageKey)
        } else {
            this.labStorage.set(selectedTabStorageKey, selectedTabIndex)
        }
    }

    /**
     * Resolves type under which the tab definition is persisted between sessions. Returns undefined for tabs
     * that cannot be persisted.
     */
    private static resolveStorableTabType(tabDefinition: AnyTabDefinition): TabType | undefined {
        if (tabDefinition instanceof EntityViewerTabDefinition) {
            return TabType.EntityViewer
        } else if (tabDefinition instanceof EvitaQLConsoleTabDefinition) {
            return TabType.EvitaQLConsole
        } else if (tabDefinition instanceof GraphQLConsoleTabDefinition) {
            return TabType.GraphQLConsole
        } else if (tabDefinition instanceof SchemaViewerTabDefinition) {
            return TabType.SchemaViewer
        } else if (tabDefinition instanceof KeymapViewerTabDefinition) {
            return TabType.KeymapViewer
        } else if (tabDefinition instanceof ServerViewerTabDefinition) {
            return TabType.ServerViewer
        } else if (tabDefinition instanceof TaskViewerTabDefinition) {
            return TabType.TaskViewer
        } else if (tabDefinition instanceof BackupViewerTabDefinition) {
            return TabType.BackupViewer
        } else if (tabDefinition instanceof JfrViewerTabDefinition) {
            return TabType.JfrViewer
        } else if (tabDefinition instanceof TrafficRecordingsViewerTabDefinition) {
            return TabType.TrafficRecordingsViewer
        } else if (tabDefinition instanceof TrafficRecordHistoryViewerTabDefinition) {
            return TabType.TrafficRecordHistoryViewer
        } else if (tabDefinition instanceof MutationHistoryViewerTabDefinition) {
            return TabType.MutationHistoryViewer
        } else if (tabDefinition instanceof ErrorViewerTabDefinition) {
            return TabType.ErrorViewer
        } else {
            return undefined
        }
    }

    /**
     * Returns all history records for a given key
     * @param historyKey
     */
    getTabHistoryRecords<R>(historyKey: TabHistoryKey<R>): R[] {
        return (this.store.tabHistory.get(historyKey.toString()) ?? []) as R[]
    }

    /**
     * Adds new history record
     * @param historyKey
     * @param record
     */
    addTabHistoryRecord<R>(historyKey: TabHistoryKey<R>, record: R): void {
        const serializedHistoryKey: string = historyKey.toString()

        let records: unknown[] | undefined = this.store.tabHistory.get(serializedHistoryKey)
        if (records == undefined) {
            records = []
            this.store.tabHistory.set(serializedHistoryKey, records)
        }

        // ignore empty records
        if (record instanceof Array) {
            let emptyParts: number = 0
            for (let i = 1; i < record.length; i++) {
                const part: unknown = record[i]
                if (part == undefined || part === '') {
                    emptyParts += 1
                }
            }
            if (emptyParts === record.length - 1) {
                return
            }
        } else {
            if (record == undefined || record === '') {
                return
            }
        }

        // ignore duplicate records
        const lastRecord: unknown = records.at(-1)
        if (lastRecord != undefined) {
            if (record instanceof Array) {
                let equalParts: number = 0
                for (let i = 1; i < record.length; i++) {
                    const recordPart: unknown = record[i]
                    const lastRecordPart: unknown = (lastRecord as unknown[])[i]
                    if (recordPart === lastRecordPart) {
                        equalParts += 1
                    }
                }
                if (equalParts === record.length - 1) {
                    return
                }
            } else {
                if (lastRecord === record) {
                    return
                }
            }
        }

        records.push(record)
        if (records.length > 10) {
            records.shift()
        }

        this.storeTabHistory()
    }

    /**
     * Clears all tab history for this key
     * @param historyKey
     */
    clearTabHistory(historyKey: TabHistoryKey<unknown>): void {
        this.store.tabHistory.delete(historyKey.toString())
    }

    /**
     * Restores last stored tab history from lab storage
     */
    restoreTabHistory(): boolean {
        // todo we should somehow validate each restored key to ensure it's still valid (connections may have been removed, static key may have been renamed, ...)

        const serializedTabHistory: string | undefined = this.labStorage.get(tabHistoryStorageKey)
        if (serializedTabHistory == undefined) {
            return false
        }
        const tabHistory: Map<string, unknown[]> = new Map(JSON.parse(LZString.decompressFromEncodedURIComponent(serializedTabHistory)))
        if (tabHistory.size === 0) {
            return false
        }
        tabHistory.forEach((value, key) => this.store.tabHistory.set(key, value))
        return true
    }

    /**
     * Store current tab history into lab storage.
     */
    storeTabHistory(): void {
        if (this.evitaLabConfig.playgroundMode) {
            return
        }
        const serializedTabHistory: string = JSON.stringify(Array.from(this.store.tabHistory.entries()))
        this.labStorage.set(tabHistoryStorageKey, LZString.compressToEncodedURIComponent(serializedTabHistory))
    }

    /**
     * Returns editor status provided by some editor. If any.
     */
    get editorStatus(): EditorStatus {
        return this.store.editorStatus as EditorStatus
    }

    /**
     * Returns subject path status holding currently activate subject path.
     */
    get subjectPathStatus(): SubjectPathStatus {
        return this.store.subjectPathStatus as SubjectPathStatus
    }
}

export const useWorkspaceService = (): WorkspaceService => {
    return mandatoryInject(workspaceServiceInjectionKey) as WorkspaceService
}
