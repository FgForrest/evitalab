import { GraphQLSchema } from 'graphql'
import { v4 as uuidv4 } from 'uuid'
import { GraphQLInstanceType } from '@/modules/graphql-console/console/model/GraphQLInstanceType'

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
 */
export class GraphQLSchemaCache {

    private readonly cachedSchemas: Map<string, GraphQLSchema> = new Map()
    private readonly graphQLSchemaChangedCallbacks: Map<string, GraphQLSchemaChangedCallback[]> = new Map()

    /**
     * Returns the cached GraphQL schema for the given API instance or builds it through the supplied
     * accessor and caches it for subsequent calls.
     *
     * @param catalogName the catalog the GraphQL API instance belongs to (`system` for the System instance)
     * @param instanceType the GraphQL API instance type
     * @param accessor thunk that fetches and builds the schema when it is not cached yet
     */
    async getSchema(
        catalogName: string,
        instanceType: GraphQLInstanceType,
        accessor: () => Promise<GraphQLSchema>
    ): Promise<GraphQLSchema> {
        const cacheKey: string = this.constructCacheKey(catalogName, instanceType)
        const cachedSchema: GraphQLSchema | undefined = this.cachedSchemas.get(cacheKey)
        if (cachedSchema != undefined) {
            return cachedSchema
        }

        const schema: GraphQLSchema = await accessor()
        this.cachedSchemas.set(cacheKey, schema)
        return schema
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
     */
    async clear(catalogName: string, instanceType: GraphQLInstanceType): Promise<void> {
        const cacheKey: string = this.constructCacheKey(catalogName, instanceType)
        this.cachedSchemas.delete(cacheKey)

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
    async clearForCatalog(catalogName: string): Promise<void> {
        await this.clear(catalogName, GraphQLInstanceType.Data)
        await this.clear(catalogName, GraphQLInstanceType.Schema)
    }

    /**
     * Removes all cached GraphQL schemas and notifies every registered callback. Used by the global
     * cache-clearing funnel, which cannot enumerate the catalog-scoped keys itself.
     */
    async clearAll(): Promise<void> {
        this.cachedSchemas.clear()
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
