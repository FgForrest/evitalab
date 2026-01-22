import { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'
import { CatalogSchema } from '@/modules/database-driver/request-response/schema/CatalogSchema'
import { v4 as uuidv4 } from 'uuid'

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
 */
export class EvitaSchemaCache {

    private cachedSchemas: Map<string, SchemaWrapper> = new Map()

    private readonly catalogSchemaChangedCallbacks: CatalogSchemaChangedCallback[] = []
    private readonly entitySchemaChangedCallbacks: Map<string, EntitySchemaChangedCallback[]> = new Map()

    constructor() {
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
        }
    }

    async getLatestCatalogSchema(schemaAccessor: () => Promise<CatalogSchema>): Promise<CatalogSchema> {
        // attempt to retrieve schema from the client side cache
        const schemaWrapper: SchemaWrapper | undefined = this.cachedSchemas.get(latestCatalogSchemaCacheKey)
        if (schemaWrapper == undefined) {
            // if not found or versions don't match - re-fetch the contents
			const schemaRelevantToSession: CatalogSchema = await schemaAccessor();
			const newCachedValue: SchemaWrapper = SchemaWrapper.fromCatalogSchema(schemaRelevantToSession);
			this.cachedSchemas.set(
				latestCatalogSchemaCacheKey,
				newCachedValue
			);
			return schemaRelevantToSession;
        } else {
            // if found in cache, update last used timestamp
			return schemaWrapper.getCatalogSchema();
        }
    }

    async removeLatestCatalogSchema(): Promise<void> {
        this.cachedSchemas.delete(latestCatalogSchemaCacheKey)
        // we call callback every time, even if the schema was not present, because some components rely on schema change
        // even without actually fetching the schema (e.g. GraphQL schema)
        for (const callback of this.catalogSchemaChangedCallbacks) {
            await (callback.callback())
        }

       await this.removeLatestEntitySchema()
    }

    async getLatestEntitySchema(
        entityType: string,
        schemaAccessor: (entityType: string) => Promise<EntitySchema | undefined>
    ): Promise<EntitySchema | undefined> {
        // attempt to retrieve schema from the client side cache
        const cacheKey: string = this.constructLatestEntitySchemaCacheKey(entityType)
        const schemaWrapper: SchemaWrapper | undefined = this.cachedSchemas.get(cacheKey)
        if (schemaWrapper == undefined) {
            // if not found - re-fetch the contents
            const schemaRelevantToSession: EntitySchema | undefined = await schemaAccessor(entityType);

            if (schemaRelevantToSession != undefined) {
                const newCachedValue: SchemaWrapper = SchemaWrapper.fromEntitySchema(schemaRelevantToSession);
                this.cachedSchemas.set(cacheKey, newCachedValue);
            }

            return schemaRelevantToSession;
        } else {
            // if found in cache, update last used timestamp
            return schemaWrapper.getEntitySchema();
        }
    }

    setLatestEntitySchema(entitySchema: EntitySchema): void {
        this.cachedSchemas.set(
            this.constructLatestEntitySchemaCacheKey(entitySchema.name),
            SchemaWrapper.fromEntitySchema(entitySchema)
        );
    }

    async removeLatestEntitySchema(entityType?: string): Promise<void> {
        if (entityType == undefined) {
            const cachedSchemaKeys: string[] = Array.from(this.cachedSchemas.keys())
            for (const cachedKey of cachedSchemaKeys) {
                const entityType: string = this.parseEntityTypeFromLatestEntitySchemaCacheKey(cachedKey)
                await this.removeLatestEntitySchema(entityType)
            }
        } else {
            this.cachedSchemas.delete(this.constructLatestEntitySchemaCacheKey(entityType))
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
     * Returns the latest cached entity schema version for the entity type if any cached
     * @param entityType
     */
    async getLatestEntitySchemaVersion(entityType: string): Promise<number | undefined> {
        const latestEntitySchema: EntitySchema | undefined = await this.getLatestEntitySchema(
            entityType,
            // we don't want to fetch schema if it is already not present, if not present, the latest version will be
            // fetched anyway
            () => undefined
        )
        return latestEntitySchema?.version
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
