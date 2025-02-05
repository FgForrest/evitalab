import { InjectionKey } from 'vue'
import LZString from 'lz-string'
import { WorkspaceStore } from '@/modules/workspace/store/workspaceStore'
import { TabDefinition } from '@/modules/workspace/tab/model/TabDefinition'
import { TabData } from '@/modules/workspace/tab/model/TabData'
import { LabStorage } from '@/modules/storage/LabStorage'
import { TabType } from '@/modules/workspace/tab/model/TabType'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { StoredTabObject } from '@/modules/workspace/tab/model/StoredTabObject'
import { TabHistoryKey } from '@/modules/workspace/tab/model/TabHistoryKey'
import { GraphQLConsoleTabFactory } from '@/modules/graphql-console/console/workspace/service/GraphQLConsoleTabFactory'
import {
    GraphQLConsoleTabDefinition
} from '@/modules/graphql-console/console/workspace/model/GraphQLConsoleTabDefinition'
import { EntityViewerTabFactory } from '@/modules/entity-viewer/viewer/workspace/service/EntityViewerTabFactory'
import { EvitaQLConsoleTabFactory } from '@/modules/evitaql-console/console/workspace/service/EvitaQLConsoleTabFactory'
import { SchemaViewerTabFactory } from '@/modules/schema-viewer/viewer/workspace/service/SchemaViewerTabFactory'
import { KeymapViewerTabFactory } from '@/modules/keymap/viewer/workspace/service/KeymapViewerTabFactory'
import { EntityViewerTabDefinition } from '@/modules/entity-viewer/viewer/workspace/model/EntityViewerTabDefinition'
import {
    EvitaQLConsoleTabDefinition
} from '@/modules/evitaql-console/console/workspace/model/EvitaQLConsoleTabDefinition'
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

const openedTabsStorageKey: string = 'openedTabs'
const tabHistoryStorageKey: string = 'tabHistory'

export const workspaceServiceInjectionKey: InjectionKey<WorkspaceService> = Symbol('workspaceService')

/**
 * Handles lifecycle of the entire workspace. Mainly, it handles creation and destruction of tabs.
 */
export class WorkspaceService {
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

    constructor(store: WorkspaceStore,
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
                trafficRecordHistoryViewerTabFactory: TrafficRecordHistoryViewerTabFactory) {
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
    }

    getTabDefinitions(): TabDefinition<any, any>[] {
        return this.store.tabDefinitions
    }

    getTabDefinition(id: string): TabDefinition<any, any> | undefined {
        return this.getTabDefinitions().find(it => it.id === id)
    }

    getTabIndex(id: string): number {
        return this.getTabDefinitions().findIndex(it => it.id === id)
    }

    /**
     * Finds newly created tab that hasn't been marked as visited yet.
     */
    getTheNewTab(): TabDefinition<any, any> | undefined {
        return this.getTabDefinitions().find(it => it.new)
    }

    /**
     * Create new tab from definition
     */
    createTab(tabDefinition: TabDefinition<any, any>): void {
        // tab definitions may share static ID to indicate only one such tab can be opened at a time
        const tabRequestWithSameId: TabDefinition<any, any> | undefined = this.getTabDefinition(tabDefinition.id)
        if (tabRequestWithSameId == undefined) {
            this.store.tabDefinitions.push(tabDefinition)
        }
    }

    markTabAsVisited(tabId: string): void {
        const tabDefinition: TabDefinition<any, any> | undefined = this.getTabDefinition(tabId)
        if (tabDefinition) {
            tabDefinition.new = false
        }
    }

    /**
     * Replace tab data with new ones
      *@param tabId
     * @param updatedData
     */
    replaceTabData(tabId: string, updatedData: TabData<any>): void {
        this.store.tabData.set(tabId, updatedData)
    }

    destroyTab(tabId: string): void {
        this.store.tabDefinitions.splice(
            this.store.tabDefinitions.findIndex(tabRequest => tabRequest.id === tabId),
            1
        )
        this.store.tabData.delete(tabId)
    }

    destroyAllTabs(): void {
        this.store.tabDefinitions.splice(0)
        this.store.tabData.clear()
    }

    /**
     * Restores last stored tab from lab storage
     * @return whether any tab data were restored
     */
    restoreTabsFromLastSession(): boolean {
        const lastOpenedTabs: StoredTabObject[] = this.labStorage.get(openedTabsStorageKey, [])
            .map((it: string) => StoredTabObject.restoreFromSerializable(it))
        this.labStorage.remove(openedTabsStorageKey)
        if (lastOpenedTabs.length === 0) {
            return false
        }

        const restoredTabsData: Map<string, TabData<any>> = new Map()
        lastOpenedTabs
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
                    default:
                        throw new UnexpectedError(`Unsupported stored tab type '${storedTabObject.tabType}'.`)
                }
            })
            .forEach(tabDefinition => {
                if (tabDefinition.initialData != undefined) {
                    restoredTabsData.set(tabDefinition.id, tabDefinition.initialData)
                }
                this.createTab(tabDefinition)
            })

        restoredTabsData.forEach((value, key) => this.store.tabData.set(key, value))
        return restoredTabsData.size > 0
    }

    /**
     * Stores current tabs into lab storage
     */
    storeOpenedTabs(): void {
        const tabsToStore: string[] = this.getTabDefinitions()
            .map(tabRequest => {
                let tabType: TabType
                if (tabRequest instanceof EntityViewerTabDefinition) {
                    tabType = TabType.EntityViewer
                } else if (tabRequest instanceof EvitaQLConsoleTabDefinition) {
                    tabType = TabType.EvitaQLConsole
                } else if (tabRequest instanceof GraphQLConsoleTabDefinition) {
                    tabType = TabType.GraphQLConsole
                } else if (tabRequest instanceof SchemaViewerTabDefinition) {
                    tabType = TabType.SchemaViewer
                } else if (tabRequest instanceof KeymapViewerTabDefinition) {
                    tabType = TabType.KeymapViewer
                } else if (tabRequest instanceof ServerViewerTabDefinition) {
                    tabType = TabType.ServerViewer
                } else if (tabRequest instanceof TaskViewerTabDefinition) {
                    tabType = TabType.TaskViewer
                } else if (tabRequest instanceof BackupViewerTabDefinition) {
                    tabType = TabType.BackupViewer
                } else if (tabRequest instanceof JfrViewerTabDefinition) {
                    tabType = TabType.JfrViewer
                } else if (tabRequest instanceof TrafficRecordingsViewerTabDefinition) {
                    tabType = TabType.TrafficRecordingsViewer
                } else if (tabRequest instanceof TrafficRecordHistoryViewerTabDefinition) {
                    tabType = TabType.TrafficRecordHistoryViewer
                } else {
                    console.info(undefined, `Unsupported tab type '${tabRequest.constructor.name}'. Not storing for next session.`)
                    return undefined
                }

                const tabData: TabData<any> | undefined = this.store.tabData.get(tabRequest.id)
                return new StoredTabObject(
                    tabType,
                    tabRequest.params.toSerializable(),
                    tabData != undefined ? tabData.toSerializable() : undefined
                )
            })
            .filter(it => it != undefined)
            .map(it => it as StoredTabObject)
            .map(it => it.toSerializable())

        this.labStorage.set(openedTabsStorageKey, tabsToStore)
    }

    /**
     * Returns all history records for a given key
     * @param historyKey
     */
    getTabHistoryRecords<R>(historyKey: TabHistoryKey<R>): R[] {
        return this.store.tabHistory.get(historyKey.toString()) ?? []
    }

    /**
     * Adds new history record
     * @param historyKey
     * @param record
     */
    addTabHistoryRecord<R>(historyKey: TabHistoryKey<R>, record: R): void {
        const serializedHistoryKey: string = historyKey.toString()

        let records: any[] | undefined = this.store.tabHistory.get(serializedHistoryKey)
        if (records == undefined) {
            records = []
            this.store.tabHistory.set(serializedHistoryKey, records)
        }

        // ignore empty records
        if (record instanceof Array) {
            let emptyParts: number = 0
            for (let i = 1; i < record.length; i++) {
                const part: any | undefined = record[i]
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
        const lastRecord: any | undefined = records.at(-1)
        if (lastRecord != undefined) {
            if (record instanceof Array) {
                let equalParts: number = 0
                for (let i = 1; i < record.length; i++) {
                    const recordPart: any | undefined = record[i]
                    const lastRecordPart: any | undefined = lastRecord[i]
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
    }

    /**
     * Clears all tab history for this key
     * @param historyKey
     */
    clearTabHistory(historyKey: TabHistoryKey<any>): void {
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
        const tabHistory: Map<string, any[]> = new Map(JSON.parse(LZString.decompressFromEncodedURIComponent(serializedTabHistory)))
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
