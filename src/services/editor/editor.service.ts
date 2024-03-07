import { Store } from 'vuex'
import { State } from '@/store'
import { inject, InjectionKey } from 'vue'
import { UnexpectedError } from '@/model/lab'
import { LabService } from '@/services/lab.service'
import { LabStorage } from '@/services/lab-storage'
import LZString from 'lz-string'
import { TabRequest } from '@/model/editor/tab/TabRequest'
import { TabRequestComponentData } from '@/model/editor/tab/TabRequestComponentData'
import { StoredTabObject } from '@/model/editor/tab/StoredTabObject'
import { TabType } from '@/model/editor/tab/TabType'
import { DataGridRequest } from '@/model/editor/tab/dataGrid/data-grid-request'
import { EvitaQLConsoleRequest } from '@/model/editor/tab/evitaQLConsole/EvitaQLConsoleRequest'
import { GraphQLConsoleRequest } from '@/model/editor/tab/graphQLConsole/GraphQLConsoleRequest'
import { SchemaViewerRequest } from '@/model/editor/tab/schemaViewer/SchemaViewerRequest'
import { KeymapViewerRequest } from '@/model/editor/tab/keymapViewer/KeymapViewerRequest'
import { TabHistoryKey } from '@/model/editor/tab/history/TabHistoryKey'

export const key: InjectionKey<EditorService> = Symbol()

const openedTabsStorageKey: string = 'openedTabs'
const tabHistoryStorageKey: string = 'tabHistory'

/**
 * Handles lifecycle of editor. Mainly, it handles creation and destruction of tabs.
 */
export class EditorService {
    private readonly store: Store<State>
    private readonly labService: LabService

    constructor(store: Store<State>, labService: LabService) {
        this.store = store
        this.labService = labService
    }

    getTabs(): TabRequest<any, any>[] {
        return this.store.state.editor.tabRequests
    }

    getTab(id: string): TabRequest<any, any> | undefined {
        return this.getTabs().find(it => it.id === id)
    }

    getTabIndex(id: string): number {
        return this.getTabs().findIndex(it => it.id === id)
    }

    getNewTab(): TabRequest<any, any> | undefined {
        return this.getTabs().find(it => it.new)
    }

    createTab(tabRequest: TabRequest<any, any>): void {
        this.store.commit('editor/addTab', tabRequest)
    }

    markTabAsVisited(tabId: string): void {
        this.store.commit('editor/markTabAsVisited', tabId)
    }

    destroyTab(tabId: string): void {
        this.store.commit('editor/destroyTab', tabId)
    }

    destroyAllTabs(): void {
        this.store.commit('editor/destroyAllTabs')
    }

    createTabsForTabsFromLastSession(): Map<string, TabRequestComponentData<any>> | undefined {
        const storage: LabStorage = this.store.state.lab.storage
        const lastOpenedTabs: StoredTabObject[] = storage.get(openedTabsStorageKey, [])
            .map((it: string) => StoredTabObject.restoreFromSerializable(it))
        storage.remove(openedTabsStorageKey)
        if (lastOpenedTabs.length === 0) {
            return undefined
        }

        const restoredTabsData: Map<string, TabRequestComponentData<any>> = new Map()
        lastOpenedTabs
            .map(storedTabObject => {
                switch (storedTabObject.tabType) {
                    case TabType.DataGrid:
                        return DataGridRequest.restoreFromJson(this.labService, storedTabObject.tabParams, storedTabObject.tabData || {})
                    case TabType.EvitaQLConsole:
                        return EvitaQLConsoleRequest.restoreFromJson(this.labService, storedTabObject.tabParams, storedTabObject.tabData || {})
                    case TabType.GraphQLConsole:
                        return GraphQLConsoleRequest.restoreFromJson(this.labService, storedTabObject.tabParams, storedTabObject.tabData || {})
                    case TabType.SchemaViewer:
                        return SchemaViewerRequest.restoreFromJson(this.labService, storedTabObject.tabParams)
                    case TabType.KeymapViewer:
                        return KeymapViewerRequest.createNew()
                    default:
                        throw new UnexpectedError(undefined, `Unsupported stored tab type '${storedTabObject.tabType}'.`)
                }
            })
            .forEach(tabRequest => {
                if (tabRequest.initialData != undefined) {
                    restoredTabsData.set(tabRequest.id, tabRequest.initialData)
                }
                this.createTab(tabRequest)
            })

        return restoredTabsData
    }

    storeOpenedTabs(tabsData: Map<string, TabRequestComponentData<any>>): void {
        const tabsToStore: string[] = this.getTabs()
            .map(tabRequest => {
                let tabType: TabType
                if (tabRequest instanceof DataGridRequest) {
                    tabType = TabType.DataGrid
                } else if (tabRequest instanceof EvitaQLConsoleRequest) {
                    tabType = TabType.EvitaQLConsole
                } else if (tabRequest instanceof GraphQLConsoleRequest) {
                    tabType = TabType.GraphQLConsole
                } else if (tabRequest instanceof SchemaViewerRequest) {
                    tabType = TabType.SchemaViewer
                } else if (tabRequest instanceof KeymapViewerRequest) {
                    tabType = TabType.KeymapViewer
                } else {
                    console.info(undefined, `Unsupported tab type '${tabRequest.constructor.name}'. Not storing for next session.`)
                    return undefined
                }

                const tabData: TabRequestComponentData<any> | undefined = tabsData.get(tabRequest.id)
                return new StoredTabObject(
                    tabType,
                    tabRequest.params.toSerializable(),
                    tabData != undefined ? tabData.toSerializable() : undefined
                )
            })
            .filter(it => it != undefined)
            .map(it => it as StoredTabObject)
            .map(it => it.toSerializable())

        const storage = this.store.state.lab.storage
        storage.set(openedTabsStorageKey, tabsToStore)
    }

    getTabHistoryRecords<R>(historyKey: TabHistoryKey<R>): R[] {
        return this.store.getters['editor/getTabHistoryRecords'](historyKey)
    }

    addTabHistoryRecord<R>(historyKey: TabHistoryKey<R>, record: R): void {
        this.store.commit('editor/addTabHistoryRecord', { historyKey, record })
    }

    clearTabHistory(historyKey: TabHistoryKey<any>): void {
        this.store.commit('editor/clearTabHistory', historyKey)
    }

    restoreTabHistory(): boolean {
        // todo we should somehow validate each restored key to ensure it's still valid (connections may have been removed, static key may have been renamed, ...)

        const storage = this.store.state.lab.storage
        const serializedTabHistory: string | undefined = storage.get(tabHistoryStorageKey)
        if (serializedTabHistory == undefined) {
            return false
        }
        const tabHistory: Map<string, any[]> = new Map(JSON.parse(LZString.decompressFromEncodedURIComponent(serializedTabHistory)))
        if (tabHistory.size === 0) {
            return false
        }
        this.store.commit('editor/prefillTabHistory', tabHistory)
        return true
    }

    storeTabHistory(): void {
        const tabHistory: Map<string, any[]> = this.store.state.editor.tabHistory
        const serializedTabHistory: string = JSON.stringify(Array.from(tabHistory.entries()))

        const storage = this.store.state.lab.storage
        storage.set(tabHistoryStorageKey, LZString.compressToEncodedURIComponent(serializedTabHistory))
    }
}

export const useEditorService = (): EditorService => {
    return inject(key) as EditorService
}
