import { List } from 'immutable'
import { CatalogStatistics } from '@/modules/database-driver/request-response/CatalogStatistics'
import { v4 as uuidv4 } from 'uuid'
import { CacheInvalidationReason } from '@/modules/database-driver/cache/CacheInvalidationReason'
import type {
    PersistentCatalogStatisticsCache
} from '@/modules/database-driver/cache/PersistentCacheDelegates'

/**
 * This class is a registry for previously fetched catalog and collection statistics to avoid excessive statistics fetching
 * from the client.
 * The statistics are used on the client side a lot, and it would be extremely slow to fetch them each time they
 * are necessary.
 *
 * Preservation **between application restarts** is provided by an optional
 * {@link PersistentCatalogStatisticsCache} delegate: the catalog listing missing from memory is looked up there
 * before the server is asked, which is what lets the connection explorer render its catalog tree instantly
 * after a reload — and at all while the server is unreachable.
 */
export class EvitaCatalogStatisticsCache {

    private _catalogStatistics?: List<CatalogStatistics> = undefined
    private readonly catalogStatisticsChangeCallbacks: Map<string, () => Promise<void>> = new Map()

    private readonly catalogStatisticsAccessor: () => Promise<List<CatalogStatistics>>
    /**
     * On-disk half of this cache. Absent when persistence is unavailable, in which case the cache behaves as a
     * plain in-memory one.
     */
    private readonly persistentCache?: PersistentCatalogStatisticsCache

    constructor(catalogStatisticsAccessor: () => Promise<List<CatalogStatistics>>,
                persistentCache?: PersistentCatalogStatisticsCache) {
        this.catalogStatisticsAccessor = catalogStatisticsAccessor
        this.persistentCache = persistentCache
    }

    /**
     * Drops the cached catalog listing and notifies listeners. The next read fetches fresh data.
     *
     * @param reason whether the persisted copy is to be dropped as well — see {@link CacheInvalidationReason}
     */
    async clear(reason: CacheInvalidationReason): Promise<void> {
        this._catalogStatistics = undefined
        if (reason === CacheInvalidationReason.ChangeEvidence) {
            await this.persistentCache?.deleteCatalogStatistics()
        }
        for (const callback of this.catalogStatisticsChangeCallbacks.values()) {
            await callback()
        }
    }

    /**
     * Replaces the cached catalog listing with a freshly fetched one and notifies listeners — but **only when
     * it actually differs** (fetch → swap → notify). Unlike {@link clear} it never leaves the cache empty, so
     * concurrent readers cannot fall into a window in which they would all re-fetch.
     *
     * @return whether the cached listing was replaced
     */
    async refresh(catalogStatistics: List<CatalogStatistics>): Promise<boolean> {
        if (
            this._catalogStatistics != undefined &&
            this.identity(this._catalogStatistics) === this.identity(catalogStatistics)
        ) {
            return false
        }

        this._catalogStatistics = catalogStatistics
        for (const callback of this.catalogStatisticsChangeCallbacks.values()) {
            await callback()
        }
        return true
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
        return List(await this.resolveCatalogStatistics(this.catalogStatisticsAccessor))
    }

    async getLatestCatalogStatisticsForCatalog(
        catalogName: string,
        statisticsAccessor: () => Promise<List<CatalogStatistics>>
    ): Promise<CatalogStatistics | undefined> {
        return (await this.resolveCatalogStatistics(statisticsAccessor))
            .find((catalogStatistics: CatalogStatistics) => catalogStatistics.name === catalogName)
    }

    /**
     * Returns the catalog listing from the cheapest available source: memory, then the persisted copy, then the
     * server through the supplied accessor.
     */
    private async resolveCatalogStatistics(
        statisticsAccessor: () => Promise<List<CatalogStatistics>>
    ): Promise<List<CatalogStatistics>> {
        if (this._catalogStatistics != undefined) {
            return this._catalogStatistics
        }

        // the persisted copy is served right away and verified against the server in the background by the
        // delegate; when it turns out to be outdated, the change callbacks fire and consumers reload
        const persistedStatistics: List<CatalogStatistics> | undefined =
            await this.persistentCache?.getCatalogStatistics()
        // the revalidation the delegate started, or a change pushed by the server, may already have landed while
        // the disk was being read - and whatever came from the server is never older than what is on disk. It
        // must not be overwritten here: the revalidation of this listing has run by then, so the older copy
        // would sit in memory with nothing left to correct it until the page is reloaded
        if (this._catalogStatistics != undefined) {
            return this._catalogStatistics
        }
        if (persistedStatistics != undefined) {
            this._catalogStatistics = persistedStatistics
            return persistedStatistics
        }

        this._catalogStatistics = await statisticsAccessor()
        return this._catalogStatistics
    }

    /**
     * Reduces a catalog listing to what evitaLab renders decisions on: which catalogs exist, in which state, at
     * which version, whether they can be opened at all and which collections they hold. Two listings with the
     * same identity are interchangeable, so swapping one for the other would only cause a pointless re-render.
     *
     * `unusable` and the collection names are part of it even though a change in them usually bumps the version
     * as well: a listing that only *looks* identical would suppress the swap **and** the change callbacks, and
     * the explorer would keep rendering a catalog as unopenable — or keep listing collections that are gone —
     * with nothing left to correct it. Statistics that merely counted differently (record counts, size on disk)
     * are deliberately left out; they are displayed, not decided on.
     */
    private identity(catalogStatistics: List<CatalogStatistics>): string {
        return catalogStatistics
            .map(it => [
                it.name,
                it.version,
                it.catalogState,
                it.unusable,
                it.entityCollectionStatistics.map(collection => collection.entityType).join(',')
            ].join(':'))
            .join('|')
    }
}
