import { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'
import { CatalogSchema } from '@/modules/database-driver/request-response/schema/CatalogSchema'
import { v4 as uuidv4 } from 'uuid'
import { CacheInvalidationReason } from '@/modules/database-driver/cache/CacheInvalidationReason'
import type { PersistentSchemaCache } from '@/modules/database-driver/cache/PersistentCacheDelegates'

const latestCatalogSchemaCacheKey: string = '_latestCatalogSchema'
const latestEntitySchemaCacheKey: string = '_latestEntitySchema'
const latestEntitySchemaCacheKeyParsePattern: RegExp = /^_latestEntitySchema:(?<entityType>.*)$/

/**
 * This class is a registry for previously fetched entity schemas to avoid excessive schema fetching from the client.
 * The entity schemas are used on the client side a lot, and it would be extremely slow to fetch them each time they
 * are necessary for query processing. Also, we want to preserve the once-fetched schemas between application restarts.
 *
 * So we cache the previously fetched schemas. The query results return the information about
 * the entity type and schema version but leave the entity schema out to keep the amount of transferred data low.
 * This cache allows to check whether we already have the entity schema for particular entity and its version present
 * in the client and if so - we just reuse it. If not, the entity schema is freshly checked.
 *
 * When the schema changes the version goes up and a new version is automatically pulled in. When logic on the client
 * stops using the previous schema version (there might be still some threads working with entities fetched with
 * the older schema version) the schema will remain idle consuming the precious memory space. Therefore, we check
 * in regular intervals whether there are unused entity schemas in the cache and if any is found, it is automatically
 * purged.
 *
 * The cache holds schemas in memory only. Preservation **between application restarts** is provided by an
 * optional {@link PersistentSchemaCache} delegate: a schema missing from memory is looked up there before the
 * server is asked, which is what lets evitaLab show a catalog right after a reload and while the server is
 * unreachable. The delegate speaks the internal model only, so this class stays free of any transport coupling.
 */
export class EvitaSchemaCache {

    private cachedSchemas: Map<string, SchemaWrapper> = new Map()

    private readonly catalogSchemaChangedCallbacks: CatalogSchemaChangedCallback[] = []
    private readonly entitySchemaChangedCallbacks: Map<string, EntitySchemaChangedCallback[]> = new Map()

    /**
     * On-disk half of this cache. Absent when persistence is unavailable, in which case the cache behaves as a
     * plain in-memory one.
     */
    private readonly persistentCache?: PersistentSchemaCache

    constructor(persistentCache?: PersistentSchemaCache) {
        this.persistentCache = persistentCache
    }

    registerCatalogSchemaChangedCallback(callback: () => Promise<void>): string {
        const id: string = uuidv4()
        this.catalogSchemaChangedCallbacks.push(new CatalogSchemaChangedCallback(id, callback))
        return id
    }

    unregisterCatalogSchemaChangedCallback(id: string): void {
        const index: number = this.catalogSchemaChangedCallbacks.findIndex(it => it.id === id)
        if (index >= 0) {
            this.catalogSchemaChangedCallbacks.splice(index, 1)
        }
    }

    registerEntitySchemaChangedCallback(entityType: string, callback: () => Promise<void>): string {
        const id: string = uuidv4()
        const registeredCallback: EntitySchemaChangedCallback = new EntitySchemaChangedCallback(id, callback)

        let callbacksForEntityType: EntitySchemaChangedCallback[] | undefined = this.entitySchemaChangedCallbacks.get(entityType)
        if (callbacksForEntityType == undefined) {
            callbacksForEntityType = []
            this.entitySchemaChangedCallbacks.set(entityType, callbacksForEntityType)
        }
        callbacksForEntityType.push(registeredCallback)

        return id
    }

    unregisterEntitySchemaChangedCallback(entityType: string, id: string): void {
        const callbacksForEntityType: EntitySchemaChangedCallback[] | undefined = this.entitySchemaChangedCallbacks.get(entityType)
        if (callbacksForEntityType != undefined) {
            const index: number = callbacksForEntityType.findIndex(callback => callback.id === id)
            if (index !== -1) {
                callbacksForEntityType.splice(index, 1)
            }
            if (callbacksForEntityType.length === 0) {
                // drop the entity type entirely: the registered types drive which schemas a catalog-wide
                // invalidation notifies, and a type nobody listens to any more must not linger there
                this.entitySchemaChangedCallbacks.delete(entityType)
            }
        }
    }

    /**
     * Returns the latest known catalog schema, taking the cheapest available source: memory, then the
     * persisted copy, then the server through the supplied accessor.
     */
    async getLatestCatalogSchema(schemaAccessor: () => Promise<CatalogSchema>): Promise<CatalogSchema> {
        const schemaWrapper: SchemaWrapper | undefined = this.cachedSchemas.get(latestCatalogSchemaCacheKey)
        if (schemaWrapper != undefined) {
            return schemaWrapper.getCatalogSchema()
        }

        // the persisted copy is served right away and verified against the server in the background by the
        // delegate; when it turns out to be outdated, the change callbacks fire exactly as on a server-pushed
        // schema change
        const persistedSchema: CatalogSchema | undefined = await this.persistentCache?.getCatalogSchema()
        // a newer version may already have landed while the disk was being read - through the revalidation the
        // delegate just started, or through a server-pushed change. Overwriting it with the persisted one would
        // put the older schema back into memory after its revalidation has already run, so nothing would correct
        // it any more
        const meanwhileCached: SchemaWrapper | undefined = this.cachedSchemas.get(latestCatalogSchemaCacheKey)
        if (meanwhileCached != undefined) {
            return meanwhileCached.getCatalogSchema()
        }
        if (persistedSchema != undefined) {
            this.cachedSchemas.set(latestCatalogSchemaCacheKey, SchemaWrapper.fromCatalogSchema(persistedSchema))
            return persistedSchema
        }

        const fetchedSchema: CatalogSchema = await schemaAccessor()
        this.cachedSchemas.set(latestCatalogSchemaCacheKey, SchemaWrapper.fromCatalogSchema(fetchedSchema))
        return fetchedSchema
    }

    /**
     * Replaces the cached catalog schema with a freshly fetched one and notifies listeners — but **only when it
     * actually differs** from what is cached (fetch → swap → notify). An identical version means the cached
     * schema was verified as current: no swap, no callbacks, no re-render churn.
     *
     * Unlike {@link removeLatestCatalogSchema} this never leaves the cache empty, so concurrent readers cannot
     * fall into a window in which they would all re-fetch.
     *
     * @return whether the cached schema was replaced
     */
    async refreshLatestCatalogSchema(catalogSchema: CatalogSchema): Promise<boolean> {
        const schemaWrapper: SchemaWrapper | undefined = this.cachedSchemas.get(latestCatalogSchemaCacheKey)
        if (schemaWrapper != undefined && schemaWrapper.getCatalogSchema().version === catalogSchema.version) {
            return false
        }

        this.cachedSchemas.set(latestCatalogSchemaCacheKey, SchemaWrapper.fromCatalogSchema(catalogSchema))
        for (const callback of this.catalogSchemaChangedCallbacks) {
            await (callback.callback())
        }
        return true
    }

    /**
     * Drops the cached catalog schema (and, cascading, every cached entity schema of the catalog) and notifies
     * listeners.
     *
     * @param reason whether the persisted copy is to be dropped as well — see {@link CacheInvalidationReason}
     */
    async removeLatestCatalogSchema(reason: CacheInvalidationReason): Promise<void> {
        this.cachedSchemas.delete(latestCatalogSchemaCacheKey)
        if (reason === CacheInvalidationReason.ChangeEvidence) {
            await this.persistentCache?.deleteCatalogSchema()
        }
        // we call callback every time, even if the schema was not present, because some components rely on schema change
        // even without actually fetching the schema (e.g. GraphQL schema)
        for (const callback of this.catalogSchemaChangedCallbacks) {
            await (callback.callback())
        }

       await this.removeLatestEntitySchema(reason)
    }

    /**
     * Returns the latest known schema of the entity type, taking the cheapest available source: memory, then
     * the persisted copy, then the server through the supplied accessor.
     */
    async getLatestEntitySchema(
        entityType: string,
        schemaAccessor: (entityType: string) => Promise<EntitySchema | undefined>
    ): Promise<EntitySchema | undefined> {
        const cacheKey: string = this.constructLatestEntitySchemaCacheKey(entityType)
        const schemaWrapper: SchemaWrapper | undefined = this.cachedSchemas.get(cacheKey)
        if (schemaWrapper != undefined) {
            return schemaWrapper.getEntitySchema()
        }

        const persistedSchema: EntitySchema | undefined = await this.persistentCache?.getEntitySchema(entityType)
        // see getLatestCatalogSchema: what arrived from the server while the disk was being read wins
        const meanwhileCached: SchemaWrapper | undefined = this.cachedSchemas.get(cacheKey)
        if (meanwhileCached != undefined) {
            return meanwhileCached.getEntitySchema()
        }
        if (persistedSchema != undefined) {
            this.cachedSchemas.set(cacheKey, SchemaWrapper.fromEntitySchema(persistedSchema))
            return persistedSchema
        }

        const fetchedSchema: EntitySchema | undefined = await schemaAccessor(entityType)
        if (fetchedSchema != undefined) {
            this.cachedSchemas.set(cacheKey, SchemaWrapper.fromEntitySchema(fetchedSchema))
        }
        return fetchedSchema
    }

    setLatestEntitySchema(entitySchema: EntitySchema): void {
        this.cachedSchemas.set(
            this.constructLatestEntitySchemaCacheKey(entitySchema.name),
            SchemaWrapper.fromEntitySchema(entitySchema)
        );
    }

    /**
     * Replaces the cached schema of an entity type with a freshly fetched one and notifies listeners — but
     * only when it actually differs. The entity-schema counterpart of {@link refreshLatestCatalogSchema}.
     *
     * @return whether the cached schema was replaced
     */
    async refreshLatestEntitySchema(entitySchema: EntitySchema): Promise<boolean> {
        const cacheKey: string = this.constructLatestEntitySchemaCacheKey(entitySchema.name)
        const schemaWrapper: SchemaWrapper | undefined = this.cachedSchemas.get(cacheKey)
        if (schemaWrapper != undefined && schemaWrapper.getEntitySchema().version === entitySchema.version) {
            return false
        }

        this.cachedSchemas.set(cacheKey, SchemaWrapper.fromEntitySchema(entitySchema))
        const callbacks: EntitySchemaChangedCallback[] | undefined =
            this.entitySchemaChangedCallbacks.get(entitySchema.name)
        if (callbacks != undefined) {
            for (const callback of callbacks) {
                await (callback.callback())
            }
        }
        return true
    }

    /**
     * Drops the cached schema of an entity type, or of every entity type of the catalog, and notifies listeners.
     *
     * @param reason whether the persisted copies are to be dropped as well — see {@link CacheInvalidationReason}
     * @param entityType if undefined, every cached (or listened-to) entity schema of the catalog is dropped
     */
    async removeLatestEntitySchema(reason: CacheInvalidationReason, entityType?: string): Promise<void> {
        if (entityType == undefined) {
            if (reason === CacheInvalidationReason.ChangeEvidence) {
                // the persisted entity schemas of this catalog are enumerable on disk only, and the in-memory
                // loop below cannot see the ones that are persisted but not cached
                await this.persistentCache?.deleteEntitySchema()
            }
            // every entity type that is cached *or* listened to has to be notified: a listener whose schema
            // is not in the cache right now (evicted by an earlier change and not re-fetched yet) would
            // otherwise never learn about this one and would keep rendering a stale schema
            const affectedEntityTypes: Set<string> = new Set(
                Array.from(this.cachedSchemas.keys())
                    .map(cachedKey => this.parseEntityTypeFromLatestEntitySchemaCacheKey(cachedKey))
            )
            for (const listenedEntityType of this.entitySchemaChangedCallbacks.keys()) {
                affectedEntityTypes.add(listenedEntityType)
            }
            for (const affectedEntityType of affectedEntityTypes) {
                // the persisted copies have already been dropped wholesale above, so the recursive calls only
                // have to handle memory and the callbacks
                await this.removeLatestEntitySchema(CacheInvalidationReason.MemoryOnly, affectedEntityType)
            }
        } else {
            this.cachedSchemas.delete(this.constructLatestEntitySchemaCacheKey(entityType))
            if (reason === CacheInvalidationReason.ChangeEvidence) {
                await this.persistentCache?.deleteEntitySchema(entityType)
            }
            // we call callback every time, even if the schema was not present, because some components rely on schema change
            // even without actually fetching the schema (e.g. GraphQL schema)
            const callbacks: EntitySchemaChangedCallback[] | undefined = this.entitySchemaChangedCallbacks.get(entityType)
            if (callbacks != undefined) {
                for (const callback of callbacks) {
                    await (callback.callback())
                }
            }
        }
    }

    /**
     * Returns the version of the entity schema currently held **in memory**, or undefined when none is.
     *
     * Deliberately does not consult the persisted copy: this backs the version-drift check every query
     * response goes through, and a query proves the server is reachable, so hydrating a schema from disk
     * (and revalidating it) there would be pointless work. A schema that is not in memory is fetched fresh
     * by the next read anyway.
     */
    getLatestEntitySchemaVersionInMemory(entityType: string): number | undefined {
        const schemaWrapper: SchemaWrapper | undefined = this.cachedSchemas.get(
            this.constructLatestEntitySchemaCacheKey(entityType)
        )
        return schemaWrapper?.getEntitySchema().version
    }

    private constructLatestEntitySchemaCacheKey(entityType: string): string {
        return `${latestEntitySchemaCacheKey}:${entityType}`
    }

    private parseEntityTypeFromLatestEntitySchemaCacheKey(cacheKey: string): string {
        const match: RegExpMatchArray | null = cacheKey.match(latestEntitySchemaCacheKeyParsePattern)
        if (match == null) {
            throw new Error(`Cannot parse entity type from cache key: ${cacheKey}`)
        }
        const entityType: string | undefined = match.groups?.entityType
        if (entityType == undefined) {
            throw new Error(`Cannot parse entity type from cache key: ${cacheKey}`)
        }
        return entityType
    }
}

class SchemaWrapper {

    /**
     * The entity schema fetched from the server.
     */
    private readonly catalogSchema?: CatalogSchema
    /**
     * The entity schema fetched from the server.
     */
    private readonly entitySchema?: EntitySchema

    constructor(catalogSchema: CatalogSchema | undefined,
                entitySchema: EntitySchema | undefined) {
        if (catalogSchema != undefined) {
            this.catalogSchema = catalogSchema
            this.entitySchema = undefined
        } else {
            this.catalogSchema = undefined
            this.entitySchema = entitySchema
        }
    }

    /**
     * Factory method to create a SchemaWrapper from a CatalogSchema.
     * @param catalogSchema The catalog schema to wrap
     * @returns A new SchemaWrapper instance
     */
    static fromCatalogSchema(catalogSchema: CatalogSchema): SchemaWrapper {
        return new SchemaWrapper(catalogSchema, undefined)
    }

    /**
     * Factory method to create a SchemaWrapper from an EntitySchema.
     * @param entitySchema The entity schema to wrap
     * @returns A new SchemaWrapper instance
     */
    static fromEntitySchema(entitySchema: EntitySchema): SchemaWrapper {
        return new SchemaWrapper(undefined, entitySchema)
    }

    /**
     * Gets the catalog schema if available.
     * @returns The catalog schema or undefined if not available
     */
    getCatalogSchema(): CatalogSchema {
        if (this.catalogSchema == undefined) {
            throw new Error('Catalog schema is not present in the wrapper.')
        }
        return this.catalogSchema
    }

    /**
     * Gets the entity schema if available.
     * @returns The entity schema or undefined if not available
     */
    getEntitySchema(): EntitySchema {
        if (this.entitySchema == undefined) {
            throw new Error('Entity schema is not present in the wrapper.')
        }
        return this.entitySchema
    }
}


export class CatalogSchemaChangedCallback {

    readonly id: string
    readonly callback: () => Promise<void>

    constructor(id: string, callback: () => Promise<void>) {
        this.id = id
        this.callback = callback
    }
}

export class EntitySchemaChangedCallback {

    readonly id: string
    readonly callback: () => Promise<void>

    constructor(id: string, callback: () => Promise<void>) {
        this.id = id
        this.callback = callback
    }
}
