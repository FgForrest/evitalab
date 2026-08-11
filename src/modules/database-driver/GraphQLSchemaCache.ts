import { GraphQLSchema } from 'graphql'
import { v4 as uuidv4 } from 'uuid'
import { GraphQLInstanceType } from '@/modules/graphql-console/console/model/GraphQLInstanceType'
import { CacheInvalidationReason } from '@/modules/database-driver/cache/CacheInvalidationReason'
import type { PersistentGraphQLSchemaCache } from '@/modules/database-driver/cache/PersistentCacheDelegates'

/**
 * A cached GraphQL schema together with the hash of the introspection result it was built from.
 *
 * The two are kept in a single entry rather than in parallel maps on purpose: a schema whose hash says it was
 * built from something else is worse than no hash at all — the refresh below decides on that hash whether the
 * consoles keep rendering what they render.
 */
export interface CachedGraphQLSchema {
    readonly schema: GraphQLSchema
    readonly introspectionHash: string
}

/**
 * Registry for previously built GraphQL schemas to avoid excessive HTTP introspection from the client.
 *
 * The GraphQL console fetches its schema via a GraphQL introspection query over HTTP and builds a
 * {@link GraphQLSchema} object out of it. Building this object for every opened console (and every reopen)
 * is expensive, so we cache the built object here and reuse it across consoles pointing at the same
 * GraphQL API instance.
 *
 * Entries are keyed by a composite `${catalogName}:${instanceType}` key, so a single instance handles
 * {@link GraphQLInstanceType.System}, {@link GraphQLInstanceType.Data} and {@link GraphQLInstanceType.Schema}
 * uniformly. The System instance uses the stable literal `system` catalog name.
 *
 * This class is intentionally free of any HTTP/gRPC coupling: the actual introspection is supplied by the
 * caller as an accessor thunk (mirroring {@link EvitaSchemaCache}), keeping {@link EvitaClient} thin.
 *
 * Preservation **between application restarts** is provided by an optional {@link PersistentGraphQLSchemaCache}
 * delegate, which rebuilds the schema from a persisted raw introspection result. A console can therefore be
 * opened, browsed and used for autocomplete while the server is unreachable; only query execution needs it.
 */
export class GraphQLSchemaCache {

    private readonly cachedSchemas: Map<string, CachedGraphQLSchema> = new Map()
    private readonly graphQLSchemaChangedCallbacks: Map<string, GraphQLSchemaChangedCallback[]> = new Map()

    /**
     * On-disk half of this cache. Absent when persistence is unavailable, in which case the cache behaves as a
     * plain in-memory one.
     */
    private readonly persistentCache?: PersistentGraphQLSchemaCache

    constructor(persistentCache?: PersistentGraphQLSchemaCache) {
        this.persistentCache = persistentCache
    }

    /**
     * Returns the GraphQL schema for the given API instance from the cheapest available source: memory, then
     * the schema rebuilt from a persisted introspection, then a fresh introspection through the supplied
     * accessor.
     *
     * @param catalogName the catalog the GraphQL API instance belongs to (`system` for the System instance)
     * @param instanceType the GraphQL API instance type
     * @param accessor thunk that fetches and builds the schema when it is not cached anywhere, together with
     *                 the hash of the introspection it was built from
     */
    async getSchema(
        catalogName: string,
        instanceType: GraphQLInstanceType,
        accessor: () => Promise<CachedGraphQLSchema>
    ): Promise<GraphQLSchema> {
        const cacheKey: string = this.constructCacheKey(catalogName, instanceType)
        const cachedSchema: CachedGraphQLSchema | undefined = this.cachedSchemas.get(cacheKey)
        if (cachedSchema != undefined) {
            return cachedSchema.schema
        }

        const persistedSchema: CachedGraphQLSchema | undefined =
            await this.persistentCache?.getSchema(catalogName, instanceType)
        // the revalidation the delegate just started may already have replaced this key while the disk was being
        // read; what came from the server is never older, and putting the persisted copy back afterwards would
        // leave it in memory with its revalidation already spent
        const meanwhileCached: CachedGraphQLSchema | undefined = this.cachedSchemas.get(cacheKey)
        if (meanwhileCached != undefined) {
            return meanwhileCached.schema
        }
        if (persistedSchema != undefined) {
            this.cachedSchemas.set(cacheKey, persistedSchema)
            return persistedSchema.schema
        }

        const schema: CachedGraphQLSchema = await accessor()
        this.cachedSchemas.set(cacheKey, schema)
        return schema.schema
    }

    /**
     * Returns the hash of the introspection the currently cached schema of an API instance was built from, or
     * `undefined` when nothing is cached for it.
     *
     * This is what a fetch-first refresh compares its fresh introspection against: the question it answers is
     * whether the schema the consoles are **displaying** is still current, which no hash read from disk can
     * tell (another tab of the same origin may have persisted a newer introspection in the meantime).
     */
    cachedIntrospectionHash(catalogName: string, instanceType: GraphQLInstanceType): string | undefined {
        return this.cachedSchemas.get(this.constructCacheKey(catalogName, instanceType))?.introspectionHash
    }

    /**
     * Registers a callback invoked whenever the cached GraphQL schema for the given API instance changes.
     *
     * @return a unique identifier that can be used to unregister the callback later
     */
    registerGraphQLSchemaChangedCallback(
        catalogName: string,
        instanceType: GraphQLInstanceType,
        callback: () => Promise<void>
    ): string {
        const cacheKey: string = this.constructCacheKey(catalogName, instanceType)
        const id: string = uuidv4()
        const registeredCallback: GraphQLSchemaChangedCallback = new GraphQLSchemaChangedCallback(id, callback)

        let callbacksForKey: GraphQLSchemaChangedCallback[] | undefined = this.graphQLSchemaChangedCallbacks.get(cacheKey)
        if (callbacksForKey == undefined) {
            callbacksForKey = []
            this.graphQLSchemaChangedCallbacks.set(cacheKey, callbacksForKey)
        }
        callbacksForKey.push(registeredCallback)

        return id
    }

    /**
     * Unregisters a previously registered GraphQL schema change callback.
     */
    unregisterGraphQLSchemaChangedCallback(
        catalogName: string,
        instanceType: GraphQLInstanceType,
        id: string
    ): void {
        const cacheKey: string = this.constructCacheKey(catalogName, instanceType)
        const callbacksForKey: GraphQLSchemaChangedCallback[] | undefined = this.graphQLSchemaChangedCallbacks.get(cacheKey)
        if (callbacksForKey != undefined) {
            const index: number = callbacksForKey.findIndex(it => it.id === id)
            if (index >= 0) {
                callbacksForKey.splice(index, 1)
            }
        }
    }

    /**
     * Removes the cached GraphQL schema for a single API instance and notifies its registered callbacks.
     * The callbacks are fired even when nothing was cached, because consumers rely on the change signal to
     * re-fetch a fresh schema regardless of the previous cache state.
     *
     * @param reason whether the persisted introspection is to be dropped as well — see
     *               {@link CacheInvalidationReason}
     */
    async clear(
        catalogName: string,
        instanceType: GraphQLInstanceType,
        reason: CacheInvalidationReason
    ): Promise<void> {
        const cacheKey: string = this.constructCacheKey(catalogName, instanceType)
        this.cachedSchemas.delete(cacheKey)
        if (reason === CacheInvalidationReason.ChangeEvidence) {
            await this.persistentCache?.deleteSchema(catalogName, instanceType)
        }

        const callbacksForKey: GraphQLSchemaChangedCallback[] | undefined = this.graphQLSchemaChangedCallbacks.get(cacheKey)
        if (callbacksForKey != undefined) {
            for (const callback of callbacksForKey) {
                await callback.callback()
            }
        }
    }

    /**
     * Replaces the cached GraphQL schema of an API instance and notifies its callbacks. Used by the
     * fetch-first refresh paths once they established that the schema really changed; the caller owns the
     * comparison, because it holds the raw introspection the decision is made on.
     */
    async refresh(
        catalogName: string,
        instanceType: GraphQLInstanceType,
        schema: CachedGraphQLSchema
    ): Promise<void> {
        const cacheKey: string = this.constructCacheKey(catalogName, instanceType)
        this.cachedSchemas.set(cacheKey, schema)

        const callbacksForKey: GraphQLSchemaChangedCallback[] | undefined = this.graphQLSchemaChangedCallbacks.get(cacheKey)
        if (callbacksForKey != undefined) {
            for (const callback of callbacksForKey) {
                await callback.callback()
            }
        }
    }

    /**
     * Removes the cached GraphQL schemas that belong to a catalog and notifies their callbacks. Only the
     * {@link GraphQLInstanceType.Data} and {@link GraphQLInstanceType.Schema} instances are catalog-scoped;
     * the {@link GraphQLInstanceType.System} instance is intentionally excluded as no catalog maps to it.
     */
    async clearForCatalog(catalogName: string, reason: CacheInvalidationReason): Promise<void> {
        await this.clear(catalogName, GraphQLInstanceType.Data, reason)
        await this.clear(catalogName, GraphQLInstanceType.Schema, reason)
    }

    /**
     * Removes all cached GraphQL schemas and notifies every registered callback. Used by the global
     * cache-clearing funnel, which cannot enumerate the catalog-scoped keys itself.
     */
    async clearAll(reason: CacheInvalidationReason): Promise<void> {
        this.cachedSchemas.clear()
        if (reason === CacheInvalidationReason.ChangeEvidence) {
            await this.persistentCache?.deleteAllSchemas()
        }
        for (const callbacksForKey of this.graphQLSchemaChangedCallbacks.values()) {
            for (const callback of callbacksForKey) {
                await callback.callback()
            }
        }
    }

    private constructCacheKey(catalogName: string, instanceType: GraphQLInstanceType): string {
        return `${catalogName}:${instanceType}`
    }
}

/**
 * Holds a single registered GraphQL schema change callback together with its identifier.
 */
export class GraphQLSchemaChangedCallback {

    readonly id: string
    readonly callback: () => Promise<void>

    constructor(id: string, callback: () => Promise<void>) {
        this.id = id
        this.callback = callback
    }
}
