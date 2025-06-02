import { List } from 'immutable'
import { CatalogStatistics } from '@/modules/database-driver/request-response/CatalogStatistics'
import { v4 as uuidv4 } from 'uuid'

/**
 * This class is a registry for previously fetched catalog and collection statistics to avoid excessive statistics fetching
 * from the client.
 * The statistics are used on the client side a lot, and it would be extremely slow to fetch them each time they
 * are necessary. Also, we want to preserve the once-fetched statistics between application restarts.
 */
export class EvitaCatalogStatisticsCache {

    private _catalogStatistics?: List<CatalogStatistics> = undefined
    private readonly catalogStatisticsChangeCallbacks: Map<string, () => Promise<void>> = new Map()

    private readonly catalogStatisticsAccessor: () => Promise<List<CatalogStatistics>>

    constructor(catalogStatisticsAccessor: () => Promise<List<CatalogStatistics>>) {
        this.catalogStatisticsAccessor = catalogStatisticsAccessor
    }

    async clear(): Promise<void> {
        this._catalogStatistics = undefined
        for (const callback of this.catalogStatisticsChangeCallbacks.values()) {
            await callback()
        }
    }

    registerCatalogStatisticsChangeCallback(callback: () => Promise<void>): string {
        const id = uuidv4()
        this.catalogStatisticsChangeCallbacks.set(id, callback)
        return id
    }

    unregisterCatalogStatisticsChangeCallback(id: string): void {
        this.catalogStatisticsChangeCallbacks.delete(id)
    }

    async getLatestCatalogStatistics(): Promise<List<CatalogStatistics>> {
        if (this._catalogStatistics == undefined) {
            this._catalogStatistics = await this.catalogStatisticsAccessor()
        }
        return List(this._catalogStatistics)
    }

    async getLatestCatalogStatisticsForCatalog(
        catalogName: string,
        statisticsAccessor: () => Promise<List<CatalogStatistics>>
    ): Promise<CatalogStatistics | undefined> {
        if (this._catalogStatistics == undefined) {
            this._catalogStatistics = await statisticsAccessor()
        }
        return this._catalogStatistics
            .find((catalogStatistics: CatalogStatistics) => catalogStatistics.name === catalogName)
    }
}
