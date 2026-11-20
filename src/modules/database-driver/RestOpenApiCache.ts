import { v4 as uuidv4 } from 'uuid'
import { RestInstanceType } from '@/modules/database-driver/connector/rest/model/RestInstanceType'
import { RestOpenApi } from '@/modules/database-driver/connector/rest/model/RestOpenApi'
import { CacheInvalidationReason } from '@/modules/database-driver/cache/CacheInvalidationReason'
import type { PersistentRestOpenApiCache } from '@/modules/database-driver/cache/PersistentCacheDelegates'

/**
 * Registry of downloaded OpenAPI specifications of evitaDB REST API instances, so that opening N REST consoles
 * for the same instance downloads (and parses) the several megabytes large catalog specification only once.
 *
 * Mirrors {@link GraphQLSchemaCache}: entries are keyed by `${catalogName}:${instanceType}` (the System instance
 * uses the stable literal `system` catalog name), consumers listen on change callbacks, concurrent reads of one
 * entry share a single load, the actual download is
 * supplied by the caller as an accessor thunk, and an optional {@link PersistentRestOpenApiCache} delegate
 * restores the specification after an application restart.
 */
export class RestOpenApiCache {

    private readonly cachedOpenApis: Map<string, RestOpenApi> = new Map()
    private readonly openApiChangedCallbacks: Map<string, RestOpenApiChangedCallback[]> = new Map()
    /**
     * Loads (disk read or download) running right now, so that N consoles asking at once — typically all open
     * consoles reacting to the same invalidation — share one download and parse of the specification.
     */
    private readonly loadsInFlight: Map<string, Promise<RestOpenApi>> = new Map()
    /**
     * How many times an entry was invalidated or replaced, per key and in total. A load remembers both when it
     * starts and stores its result only if neither changed meanwhile — otherwise a load that started before a
     * `clear()` would put the stale specification back into the cache.
     */
    private readonly keyGenerations: Map<string, number> = new Map()
    private globalGeneration: number = 0

    private readonly persistentCache?: PersistentRestOpenApiCache

    constructor(persistentCache?: PersistentRestOpenApiCache) {
        this.persistentCache = persistentCache
    }

    /**
     * Returns the specification of the given REST API instance from the cheapest available source: memory, then
     * the persisted copy, then a fresh download through the supplied accessor.
     */
    async getOpenApi(
        catalogName: string,
        instanceType: RestInstanceType,
        accessor: () => Promise<RestOpenApi>
    ): Promise<RestOpenApi> {
        const cacheKey: string = this.constructCacheKey(catalogName, instanceType)
        const cachedOpenApi: RestOpenApi | undefined = this.cachedOpenApis.get(cacheKey)
        if (cachedOpenApi != undefined) {
            return cachedOpenApi
        }
        const loadInFlight: Promise<RestOpenApi> | undefined = this.loadsInFlight.get(cacheKey)
        if (loadInFlight != undefined) {
            return await loadInFlight
        }

        const load: Promise<RestOpenApi> = this.load(cacheKey, catalogName, instanceType, accessor)
        this.loadsInFlight.set(cacheKey, load)
        try {
            return await load
        } finally {
            // a clear() may have dropped this load and a newer one may have taken its place
            if (this.loadsInFlight.get(cacheKey) === load) {
                this.loadsInFlight.delete(cacheKey)
            }
        }
    }

    private async load(
        cacheKey: string,
        catalogName: string,
        instanceType: RestInstanceType,
        accessor: () => Promise<RestOpenApi>
    ): Promise<RestOpenApi> {
        const generation: string = this.generationOf(cacheKey)

        const persistedOpenApi: RestOpenApi | undefined =
            await this.persistentCache?.getOpenApi(catalogName, instanceType)
        // the revalidation the delegate just started may have replaced the entry while the disk was being read;
        // what came from the server is never older than the disk copy
        const meanwhileCached: RestOpenApi | undefined = this.cachedOpenApis.get(cacheKey)
        if (meanwhileCached != undefined) {
            return meanwhileCached
        }
        if (persistedOpenApi != undefined) {
            this.storeIfCurrent(cacheKey, generation, persistedOpenApi)
            return persistedOpenApi
        }

        const openApi: RestOpenApi = await accessor()
        this.storeIfCurrent(cacheKey, generation, openApi)
        return openApi
    }

    /**
     * Stores the result of a load unless the entry was invalidated or replaced while the load ran. The caller
     * still receives the result; the invalidation has notified it to load again.
     */
    private storeIfCurrent(cacheKey: string, generation: string, openApi: RestOpenApi): void {
        if (this.generationOf(cacheKey) === generation && !this.cachedOpenApis.has(cacheKey)) {
            this.cachedOpenApis.set(cacheKey, openApi)
        }
    }

    private generationOf(cacheKey: string): string {
        return `${this.globalGeneration}:${this.keyGenerations.get(cacheKey) ?? 0}`
    }

    private invalidateKey(cacheKey: string): void {
        this.keyGenerations.set(cacheKey, (this.keyGenerations.get(cacheKey) ?? 0) + 1)
        this.loadsInFlight.delete(cacheKey)
    }

    /**
     * Returns the hash of the specification currently held in memory for the instance, or `undefined` when
     * nothing is cached. A fetch-first refresh compares against it, because it is what the consoles display.
     */
    cachedSpecHash(catalogName: string, instanceType: RestInstanceType): string | undefined {
        return this.cachedOpenApis.get(this.constructCacheKey(catalogName, instanceType))?.specHash
    }

    /**
     * Registers a callback invoked whenever the cached specification of the given instance changes.
     *
     * @return a unique identifier that can be used to unregister the callback later
     */
    registerOpenApiChangedCallback(
        catalogName: string,
        instanceType: RestInstanceType,
        callback: () => Promise<void>
    ): string {
        const cacheKey: string = this.constructCacheKey(catalogName, instanceType)
        const id: string = uuidv4()

        let callbacksForKey: RestOpenApiChangedCallback[] | undefined = this.openApiChangedCallbacks.get(cacheKey)
        if (callbacksForKey == undefined) {
            callbacksForKey = []
            this.openApiChangedCallbacks.set(cacheKey, callbacksForKey)
        }
        callbacksForKey.push(new RestOpenApiChangedCallback(id, callback))
        return id
    }

    /**
     * Unregisters a previously registered specification change callback.
     */
    unregisterOpenApiChangedCallback(catalogName: string, instanceType: RestInstanceType, id: string): void {
        const callbacksForKey: RestOpenApiChangedCallback[] | undefined =
            this.openApiChangedCallbacks.get(this.constructCacheKey(catalogName, instanceType))
        if (callbacksForKey != undefined) {
            const index: number = callbacksForKey.findIndex(it => it.id === id)
            if (index >= 0) {
                callbacksForKey.splice(index, 1)
            }
        }
    }

    /**
     * Removes the cached specification of a single instance and notifies its callbacks (even when nothing was
     * cached — consumers rely on the signal to fetch a fresh one).
     *
     * @param reason whether the persisted copy is to be dropped as well — see {@link CacheInvalidationReason}
     */
    async clear(catalogName: string, instanceType: RestInstanceType, reason: CacheInvalidationReason): Promise<void> {
        const cacheKey: string = this.constructCacheKey(catalogName, instanceType)
        this.cachedOpenApis.delete(cacheKey)
        this.invalidateKey(cacheKey)
        if (reason === CacheInvalidationReason.ChangeEvidence) {
            await this.persistentCache?.deleteOpenApi(catalogName, instanceType)
        }
        await this.notify(cacheKey)
    }

    /**
     * Replaces the cached specification of an instance and notifies its callbacks. Used by the fetch-first
     * refresh once it established that the specification really changed.
     */
    async refresh(catalogName: string, instanceType: RestInstanceType, openApi: RestOpenApi): Promise<void> {
        const cacheKey: string = this.constructCacheKey(catalogName, instanceType)
        this.invalidateKey(cacheKey)
        this.cachedOpenApis.set(cacheKey, openApi)
        await this.notify(cacheKey)
    }

    /**
     * Removes the cached specification of the catalog REST API of a catalog. The System instance is not
     * catalog-scoped and is therefore left alone.
     */
    async clearForCatalog(catalogName: string, reason: CacheInvalidationReason): Promise<void> {
        await this.clear(catalogName, RestInstanceType.Catalog, reason)
    }

    /**
     * Removes all cached specifications and notifies every registered callback.
     */
    async clearAll(reason: CacheInvalidationReason): Promise<void> {
        this.cachedOpenApis.clear()
        this.globalGeneration++
        this.loadsInFlight.clear()
        if (reason === CacheInvalidationReason.ChangeEvidence) {
            await this.persistentCache?.deleteAllOpenApis()
        }
        for (const callbacksForKey of this.openApiChangedCallbacks.values()) {
            for (const callback of callbacksForKey) {
                await callback.callback()
            }
        }
    }

    private async notify(cacheKey: string): Promise<void> {
        const callbacksForKey: RestOpenApiChangedCallback[] | undefined = this.openApiChangedCallbacks.get(cacheKey)
        if (callbacksForKey != undefined) {
            for (const callback of callbacksForKey) {
                await callback.callback()
            }
        }
    }

    private constructCacheKey(catalogName: string, instanceType: RestInstanceType): string {
        return `${catalogName}:${instanceType}`
    }
}

/**
 * Holds a single registered specification change callback together with its identifier.
 */
export class RestOpenApiChangedCallback {

    readonly id: string
    readonly callback: () => Promise<void>

    constructor(id: string, callback: () => Promise<void>) {
        this.id = id
        this.callback = callback
    }
}
