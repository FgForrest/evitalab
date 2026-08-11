import { EvitaClient } from '@/modules/database-driver/EvitaClient'
import { ServerStatus } from '@/modules/database-driver/request-response/status/ServerStatus'
import type { InjectionKey, Ref } from 'vue'
import { mandatoryInject } from '@/utils/reactivity'
import { List } from 'immutable'
import { CatalogStatistics } from '@/modules/database-driver/request-response/CatalogStatistics'
import { LabStorage } from '@/modules/storage/LabStorage'
import { defaultPanelWidth, sanitizePanelWidth } from '@/modules/connection-explorer/model/panelWidth'

const panelWidthStorageKey: string = 'connectionExplorerPanelWidth'

export const connectionExplorerServiceInjectionKey: InjectionKey<ConnectionExplorerService> = Symbol('connectionExplorerService')

export class ConnectionExplorerService {

    private readonly evitaClient: EvitaClient
    private readonly labStorage: LabStorage

    constructor(evitaClient: EvitaClient, labStorage: LabStorage) {
        this.evitaClient = evitaClient
        this.labStorage = labStorage
    }

    async getServerStatus(): Promise<ServerStatus> {
        return await this.evitaClient.management.getServerStatus()
    }

    registerServerStatusChangeCallback(callback: () => Promise<void>): string {
        return this.evitaClient.management.registerServerStatusChangeCallback(callback)
    }

    unregisterServerStatusChangeCallback(id: string): void {
        this.evitaClient.management.unregisterServerStatusChangeCallback(id)
    }

    async getCatalogs(): Promise<List<CatalogStatistics>> {
        return (await this.evitaClient.management
            .getCatalogStatistics())
            .sort((a: CatalogStatistics, b: CatalogStatistics) => {
                return a.name.localeCompare(b.name)
            })
    }

    registerCatalogChangeCallback(callback: () => Promise<void>): string {
        return this.evitaClient.management.registerCatalogStatisticsChangeCallback(callback)
    }

    unregisterCatalogChangeCallback(id: string): void {
        this.evitaClient.management.unregisterCatalogStatisticsChangeCallback(id)
    }

    /**
     * Reactive "evitaLab is offline" state, used to badge the panel header while the server is unreachable.
     */
    get serverUnreachable(): Readonly<Ref<boolean>> {
        return this.evitaClient.serverUnreachable
    }

    /**
     * Discards everything evitaLab has persisted about this server, so it starts cold next time.
     *
     * @return whether evitaLab is able to persist anything at all; `false` means there can have been nothing
     *         to discard
     */
    async clearLocalCache(): Promise<boolean> {
        return await this.evitaClient.clearPersistentCache()
    }

    /**
     * Width of the explorer panel the user last chose, in pixels. Only sanitized, never fitted to the
     * viewport: the persisted width is the user's preference and must survive a temporarily narrow window,
     * fitting it to the actual viewport is the panel's job.
     */
    getPanelWidth(): number {
        return sanitizePanelWidth(this.labStorage.get(panelWidthStorageKey, defaultPanelWidth))
    }

    /**
     * Remembers the width of the explorer panel for the next lab start.
     */
    setPanelWidth(width: number): void {
        this.labStorage.set(panelWidthStorageKey, sanitizePanelWidth(width))
    }
}

export function useConnectionExplorerService(): ConnectionExplorerService {
    return mandatoryInject(connectionExplorerServiceInjectionKey) as ConnectionExplorerService
}
