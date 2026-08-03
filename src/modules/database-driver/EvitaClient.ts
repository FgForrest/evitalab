import { AbstractEvitaClient } from '@/modules/database-driver/AbstractEvitaClient'
import type {
    GrpcCatalogNamesResponse,
    GrpcDefineCatalogResponse,
    GrpcEvitaSessionResponse
} from '@/modules/database-driver/connector/grpc/gen/GrpcEvitaAPI_pb'
import { EvitaClientSession } from '@/modules/database-driver/EvitaClientSession'
import { Code, ConnectError } from '@connectrpc/connect'
import { EvitaClientManagement } from '@/modules/database-driver/EvitaClientManagement'
import { EvitaSchemaCache } from '@/modules/database-driver/EvitaSchemaCache'
import { GraphQLSchemaCache } from '@/modules/database-driver/GraphQLSchemaCache'
import { buildClientSchema, getIntrospectionQuery, GraphQLSchema, type IntrospectionQuery } from 'graphql'
import { Set } from 'immutable'
import type { InjectionKey } from 'vue'
import { mandatoryInject } from '@/utils/reactivity'
import { GraphQLInstanceType } from '@/modules/graphql-console/console/model/GraphQLInstanceType'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import type { GraphQLResponse } from '@/modules/database-driver/connector/gql/model/GraphQLResponse'
import { EvitaLabConfig } from '@/modules/config/EvitaLabConfig'
import { ConnectionService } from '@/modules/connection/service/ConnectionService'
import { CatalogStatistics } from '@/modules/database-driver/request-response/CatalogStatistics'
import type {
    ApplyMutationWithProgressResponse
} from '@/modules/database-driver/request-response/schema/ApplyMutationWithProgressResponse.ts'
import { GrpcChangeCaptureContent } from '@/modules/database-driver/connector/grpc/gen/GrpcChangeCapture_pb.ts'
import type {
    RegisterSystemChangeCaptureResponse
} from '@/modules/database-driver/request-response/cdc/RegisterSystemChangeCaptureResponse.ts'
import { SessionRetryFailedError } from '@/modules/database-driver/exception/SessionRetryFailedError.ts'

export const evitaClientInjectionKey: InjectionKey<EvitaClient> = Symbol('EvitaClient')

/**
 * Describes how a piece of logic is to be executed against the shared session of a single catalog.
 * Passed as an object on purpose: the flags are all booleans, and a positional signature would let
 * a refactoring shift them unnoticed.
 */
interface SharedSessionExecution {
    readonly catalogName: string
    /**
     * Whether the shared session must be created in the read-write mode. Every caller sharing a session
     * of a given catalog must agree on this, because it is derived from the catalog state, not from the caller.
     */
    readonly readWrite: boolean
    /**
     * Whether the catalog is in the warming up state, where evitaDB permits exactly one open session.
     */
    readonly warmup: boolean
    /**
     * Whether the currently shared session must be replaced with a brand new one first (to see fresh data).
     */
    readonly forceNewSession: boolean
    /**
     * Whether the logic mutates data. Such logic is never replayed after *we* evicted its session,
     * because the failure it observed may have come from a mutation that was already partially applied.
     *
     * It is still replayed when the *server* dropped the session (the unauthenticated branch of
     * {@link EvitaClient.executeInSharedSession}): the server refuses calls on a session it no longer
     * knows, so nothing of the logic could have been applied. Do not merge the two branches.
     */
    readonly mutating: boolean
}

export function useEvitaClient(): EvitaClient {
    return mandatoryInject(evitaClientInjectionKey) as EvitaClient
}

/**
 * Evita client provides access to specific EvitaDB server. It is an entry class
 * for any operation with evitaDB server.
 *
 * It takes great inspiration in the `EvitaClient` class in evitaDB Java client, but
 * because this client is specifically designed for the evitaLab, some behaviours
 * are different or simplified.
 */
export class EvitaClient extends AbstractEvitaClient {
    private readonly schemaCache: Map<string, EvitaSchemaCache> = new Map()
    private readonly graphQLSchemaCache: GraphQLSchemaCache = new GraphQLSchemaCache()
    private _management?: EvitaClientManagement

    /**
     * We don't want to create a session for each UI call to evita. Both server resources and network workload are
     * saved by this. Also, most calls represent fetching a schema that are cached locally anyway.
     * @private
     */
    private readonly sharedSessions: Map<string, EvitaClientSession> = new Map()
    /**
     * Shared sessions whose creation is still in flight, keyed by catalog name. Concurrent callers await
     * the same creation instead of opening a session of their own.
     */
    private readonly sharedSessionsInCreation: Map<string, Promise<EvitaClientSession>> = new Map()
    /**
     * Pending closes of shared sessions that still had in-flight callers when they were evicted, keyed by
     * catalog name. Only warming-up catalogs have to wait for them, because evitaDB permits a single
     * open session there.
     */
    private readonly sharedSessionsClosing: Map<string, Promise<void>> = new Map()

    constructor(evitaLabConfig: EvitaLabConfig,
                connectionService: ConnectionService) {
        super(evitaLabConfig, connectionService)
    }

    /**
     * Returns a complete listing of all catalogs known to the Evita instance.
     */
    async getCatalogNames(): Promise<Set<string>> {
        try {
            const response: GrpcCatalogNamesResponse = await this.evitaClient.getCatalogNames({})
            return Set(response.catalogNames)
        } catch (e) {
            throw this.errorTransformer.transformError(e)
        }
    }

    /**
     * Creates new catalog of particular name if it doesn't exist with empty schema.
     */
    async createCatalog(catalogName: string): Promise<boolean> {
        try {
            const catalogResponse: GrpcDefineCatalogResponse =
                await this.evitaClient.defineCatalog({ catalogName })

            return catalogResponse.success
        } catch (e) {
            throw this.errorTransformer.transformError(e)
        }
    }

    /**
     * Renames existing catalog to a new name. The `newCatalogName` must not clash with any existing catalog name,
     * otherwise exception is thrown. If you need to rename catalog to a name of existing catalog use
     * the {@link #replaceCatalog(String, String)} method instead.
     *
     * In case exception occurs the original catalog (`catalogName`) is guaranteed to be untouched,
     * and the `newCatalogName` will not be present.
     */
    async renameCatalog(catalogName: string, newCatalogName: string): Promise<boolean> {
        try {
            const response = await this.evitaClient
                .renameCatalog({
                    catalogName,
                    newCatalogName
                })
            if (response.success) {
                this.schemaCache.delete(catalogName)
                this.schemaCache.delete(newCatalogName)
            }
            return response.success
        } catch (e) {
            throw this.errorTransformer.transformError(e)
        }
    }

    /**
     * Replaces existing catalog of particular with the contents of the another catalog. When this method is
     * successfully finished, the catalog `catalogNameToBeReplacedWith` will be known under the name of the
     * `catalogNameToBeReplaced` and the original contents of the `catalogNameToBeReplaced` will be purged entirely.
     *
     * In case exception occurs, the original catalog (`catalogNameToBeReplaced`) is guaranteed to be untouched, the
     * state of `catalogNameToBeReplacedWith` is however unknown and should be treated as damaged.
     */
    async replaceCatalog(
        catalogNameToBeReplacedWith: string,
        catalogNameToBeReplaced: string
    ): Promise<boolean> {
        try {
            const response = await this.evitaClient
                .replaceCatalog({
                    catalogNameToBeReplacedWith,
                    catalogNameToBeReplaced
                })
            if (response.success) {
                this.schemaCache.delete(catalogNameToBeReplaced);
                this.schemaCache.delete(catalogNameToBeReplacedWith);
            }
            return response.success
        } catch (e) {
            throw this.errorTransformer.transformError(e)
        }
    }

    /**
     * Deletes catalog with name `catalogName` along with its contents on disk.
     */
    async deleteCatalogIfExists(catalogName: string): Promise<boolean> {
        try {
            const response = await this.evitaClient
                .deleteCatalogIfExists({
                    catalogName
                })
            if (response.success) {
                this.schemaCache.delete(catalogName);
            }
            return response.success
        } catch (e) {
            throw this.errorTransformer.transformError(e)
        }
    }

    async queryCatalog<T>(
        catalogName: string,
        queryLogic: (session: EvitaClientSession) => Promise<T>,
        forceNewSession: boolean = false
    ): Promise<T> {
        try {
            const catalog: CatalogStatistics = await this.management.getCatalogStatisticsForCatalog(catalogName)

            return (await this.executeInSharedSession<T>(
                {
                    catalogName,
                    readWrite: catalog.isInWarmup,
                    warmup: catalog.isInWarmup,
                    // there is no point in forcing a new session in the warming up mode, in the warming up mode all mutations
                    // are visible everywhere, because there is only one shared session
                    forceNewSession: catalog.isInWarmup ? false : forceNewSession,
                    mutating: false
                },
                queryLogic,
                true
            )) as T
        } catch (e) {
            throw this.errorTransformer.transformError(e)
        }
    }

    async queryCatalogUsingGraphQL(
        catalogName: string,
        instanceType: GraphQLInstanceType,
        query: string,
        variables: Record<string, unknown> = {},
        signal?: AbortSignal
    ): Promise<GraphQLResponse> {
        let path
        if (instanceType === GraphQLInstanceType.System) {
            path = 'system'
        } else {
            switch (instanceType) {
                case GraphQLInstanceType.Data:
                    path = catalogName
                    break
                case GraphQLInstanceType.Schema:
                    path = `${catalogName}/schema`
                    break
                default: throw new UnexpectedError(`Unsupported GraphQL instance type '${instanceType}'.`)
            }
        }

        try {
            return (
                await this.httpApiClient.post(
                    `${this.connection.graphQlUrl}/${path}`,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'X-EvitaDB-ClientID': 'evitaLab-' + encodeURIComponent(this.evitaLabConfig.serverName)
                        },
                        body: JSON.stringify({
                            query,
                            variables
                        }),
                        signal
                    }
                )
                    .json()
            ) as GraphQLResponse
        } catch (e) {
            throw this.errorTransformer.transformError(e)
        }
    }

    /**
     * Returns the built GraphQL schema for a given GraphQL API instance. The schema is fetched through
     * HTTP introspection only once per `(catalogName, instanceType)` and cached; subsequent calls reuse
     * the cached {@link GraphQLSchema}. Pass a `signal` to bound (and genuinely cancel) the introspection
     * request.
     */
    async getGraphQLSchema(
        catalogName: string,
        instanceType: GraphQLInstanceType,
        signal?: AbortSignal
    ): Promise<GraphQLSchema> {
        return this.graphQLSchemaCache.getSchema(catalogName, instanceType, async () => {
            const introspection: GraphQLResponse = await this.queryCatalogUsingGraphQL(
                catalogName,
                instanceType,
                getIntrospectionQuery(),
                {},
                signal
            )
            return buildClientSchema(introspection.data as IntrospectionQuery)
        })
    }

    /**
     * Registers a callback invoked when the cached GraphQL schema of a given GraphQL API instance changes.
     *
     * @return a unique identifier that can be used to unregister the callback later
     */
    registerGraphQLSchemaChangedCallback(
        catalogName: string,
        instanceType: GraphQLInstanceType,
        callback: () => Promise<void>
    ): string {
        return this.graphQLSchemaCache.registerGraphQLSchemaChangedCallback(catalogName, instanceType, callback)
    }

    /**
     * Unregisters a previously registered GraphQL schema change callback.
     */
    unregisterGraphQLSchemaChangedCallback(
        catalogName: string,
        instanceType: GraphQLInstanceType,
        id: string
    ): void {
        this.graphQLSchemaCache.unregisterGraphQLSchemaChangedCallback(catalogName, instanceType, id)
    }

    /**
     * Clears the cached GraphQL schema for a single GraphQL API instance and fires its change callbacks,
     * causing open consoles to reload just that schema. Touches nothing else (no entity caches, no
     * catalog-schema callbacks) — used by the console's manual "Reload GraphQL schema" action.
     */
    async clearGraphQLSchemaCache(catalogName: string, instanceType: GraphQLInstanceType): Promise<void> {
        await this.graphQLSchemaCache.clear(catalogName, instanceType)
    }

    async updateCatalog<T>(
        catalogName: string,
        updateLogic: (session: EvitaClientSession) => Promise<T>
    ): Promise<T> {
        try {
            const catalog: CatalogStatistics = await this.management.getCatalogStatisticsForCatalog(catalogName)

            if (catalog.isInWarmup) {
                // in the warming up state, we need to share sessions because evitaDB doesn't support parallel sessions in
                // this state
                return await this.executeInSharedSession(
                    {
                        catalogName,
                        readWrite: true,
                        warmup: true,
                        forceNewSession: false,
                        mutating: true
                    },
                    updateLogic,
                    true
                )
            } else {
                // in the alive state, we want only short lived sessions to always fetch fresh data
                let session: EvitaClientSession | undefined = undefined
                try {
                    session = await this.createSession(catalogName, true)
                    return await updateLogic(session)
                } finally {
                    if (session != undefined) {
                        await session.close()
                        await this.terminateSharedSession(catalogName) // clear old sessions after a possible commit
                    }
                }
            }
        } catch (e) {
            throw this.errorTransformer.transformError(e)
        }
    }

    /**
     * Runs the logic against the shared session of a catalog, transparently recovering from a session
     * that ceased to exist underneath the logic.
     *
     * @param execution how the shared session is to be obtained
     * @param logic logic to execute in the shared session
     * @param retryOnSessionClosed whether the logic may still be replayed once on a fresh session
     */
    private async executeInSharedSession<T>(
        execution: SharedSessionExecution,
        logic: (session: EvitaClientSession) => Promise<T>,
        retryOnSessionClosed: boolean
    ): Promise<T> {
        const catalogName: string = execution.catalogName
        let session: EvitaClientSession | undefined = undefined
        let sessionClosedByUs: boolean = false
        try {
            session = await this.getOrCreateSharedSession(
                catalogName,
                execution.readWrite,
                execution.warmup,
                execution.forceNewSession
            )
            const acquiredSession: EvitaClientSession = session
            acquiredSession.acquire()
            try {
                return await logic(acquiredSession)
            } catch (e) {
                // this must be evaluated here, before `release` below may close a session whose close was
                // pending - otherwise every genuine failure would look like a session we destroyed ourselves
                sessionClosedByUs = !acquiredSession.isActive
                    || this.sharedSessions.get(catalogName) !== acquiredSession
                throw e
            } finally {
                acquiredSession.release()
            }
        } catch (e) {
            // we closed the session underneath the caller (forceNewSession, terminateSharedSession,
            // clearSchemaCache, clearCache, ...), so the logic never observed a genuine failure and can be
            // safely replayed. This is deliberately based on our own knowledge and not on the error, because
            // evitaDB reports a terminated session as an ordinary invalid-usage error, indistinguishable
            // from a malformed query. Mutating logic is excluded - it may have been partially applied already.
            if (sessionClosedByUs && !execution.mutating) {
                // do NOT close the session again, we already did; another Close call would only add noise
                if (retryOnSessionClosed) {
                    return await this.executeInSharedSession(execution, logic, false)
                }
                throw new SessionRetryFailedError(catalogName, e)
            }

            // the server dropped the session on its own (e.g. on the inactivity timeout); a session it can
            // no longer resolve is reported as unauthenticated
            if (e instanceof ConnectError && e.code === Code.Unauthenticated) {
                // noinspection PointlessBooleanExpressionJS
                if (session != undefined) {
                    this.closeSession(session)
                }

                if (retryOnSessionClosed) {
                    // retry once with a new session
                    return await this.executeInSharedSession(execution, logic, false)
                } else {
                    throw new SessionRetryFailedError(catalogName, e)
                }
            }
            throw e
        }
    }

    async closeSharedSession(catalogName: string): Promise<void> {
        const sharedSession: EvitaClientSession | undefined = this.sharedSessions.get(catalogName)
        if (sharedSession != undefined) {
            this.closeSession(sharedSession)
        }
    }

    /**
     * Returns management service that allows to execute various management tasks on the Evita instance and retrieve
     * global evitaDB information. These operations might require special permissions for execution and are not used
     * daily and therefore are segregated into special management class.
     */
    get management(): EvitaClientManagement {
        if (this._management == undefined) {
            this._management = new EvitaClientManagement(
                this.errorTransformer,
                this,
                () => this.evitaManagementClient,
                () => this.catalogStatisticsConverter,
                () => this.serverStatusConverter,
                () => this.engineSettingsConverter,
                () => this.reservedKeywordsConverter,
                () => this.serverFileConverter,
                () => this.taskStateConverter,
                () => this.taskStatusConverter
            )
        }
        return this._management
    }

    /**
     * Registers a callback function that will be invoked when a new version of the schema of a specified catalog is known.
     *
     * @param {string} catalogName - The name of the catalog for which the callback should be registered.
     * @param {Function} callback - A function to be invoked when a new version of the schema of the specified catalog is known.
     * @return {string} A unique identifier for the registered callback, which can be used for managing or removing the callback if necessary.
     */
    registerCatalogSchemaChangedCallback(catalogName: string, callback: () => Promise<void>): string {
        const schemaCacheForCatalog: EvitaSchemaCache = this.getOrCreateSchemaCache(catalogName)
        return schemaCacheForCatalog.registerCatalogSchemaChangedCallback(callback)
    }

    /**
     * Unregisters a callback that was previously registered for changes to the schema of a specific catalog.
     *
     * @param catalogName The name of the catalog for which the schema change callback was registered.
     * @param id The unique identifier of the callback to be unregistered.
     * @return void
     */
    unregisterCatalogSchemaChangedCallback(catalogName: string, id: string): void {
        const schemaCacheForCatalog: EvitaSchemaCache | undefined = this.schemaCache.get(catalogName)
        if (schemaCacheForCatalog != undefined) {
            schemaCacheForCatalog.unregisterCatalogSchemaChangedCallback(id)
        }
    }

    /**
     * Registers a callback function to be invoked when a new version of the schema of an entity type is known within a specified catalog.
     *
     * @param {string} catalogName - The name of the catalog in which the entity type schema change should be monitored.
     * @param {string} entityType - The type of the entity for which the schema changes are being tracked.
     * @param {Function} callback - The callback function to be executed when the entity schema changes. This function takes no arguments.
     * @return {string} - A unique identifier (UUID) representing the registered callback.
     */
    registerEntitySchemaChangedCallback(catalogName: string, entityType: string, callback: () => Promise<void>): string {
        const schemaCacheForCatalog: EvitaSchemaCache = this.getOrCreateSchemaCache(catalogName)
        return schemaCacheForCatalog.registerEntitySchemaChangedCallback(entityType, callback)
    }

    /**
     * Unregisters a previously registered callback for entity schema changes for a specific catalog.
     *
     * @param {string} catalogName - The name of the catalog associated with the callback to be removed.
     * @param {string} entityType - The type of the entity for which the callback was registered.
     * @param {string} id - The unique identifier of the callback to unregister.
     * @return {void} This method does not return a value.
     */
    unregisterEntitySchemaChangedCallback(catalogName: string, entityType: string, id: string): void {
        const schemaCacheForCatalog: EvitaSchemaCache | undefined = this.schemaCache.get(catalogName)
        if (schemaCacheForCatalog != undefined) {
            schemaCacheForCatalog.unregisterEntitySchemaChangedCallback(entityType, id)
        }
    }

    /**
     * Clears all client cache (statistics, schemas, ...).
     */
    async clearCache(): Promise<void> {
        if (this._management != undefined) {
            // refresh the server status first: it is the reachability signal consumers rely on to
            // decide whether reloading catalog-level data is even worth attempting
            await this.management.clearServerMetadataCache()
            await this.management.clearCatalogStatisticsCache()
        }
        // we need a new session if we want to load a new data
        for (const sharedSession of this.sharedSessions.values()) {
            this.closeSession(sharedSession)
        }
        const cachedCatalogs: IterableIterator<string> = this.schemaCache.keys()
        for (const cachedCatalog of cachedCatalogs) {
            await this.schemaCache.get(cachedCatalog)!.removeLatestCatalogSchema()
        }
        // the GraphQL schema cache tracks its own (catalog, instanceType) keys that need not overlap
        // with the internal schema cache above, so clear it through its own funnel
        await this.graphQLSchemaCache.clearAll()
    }

    /**
     * Clears schema caches. The next schema fetch will provide the latest schema.
     *
     * @param catalogName for which catalog to clear schemas
     * @param entityType if undefined, entire catalog cache is cleared; otherwise only entity schema for a specified
     *                  entity type is cleared
     */
    async clearSchemaCache(catalogName: string, entityType?: string): Promise<void> {
        // a catalog schema change also invalidates the derived GraphQL schemas; do this regardless of
        // whether an internal (gRPC-model) cache exists for the catalog, because a GraphQL console may be
        // the only consumer for it (introspection is a raw HTTP call, no EvitaSchemaCache is created)
        if (entityType == undefined) {
            await this.graphQLSchemaCache.clearForCatalog(catalogName)
        }

        const schemaCacheForCatalog: EvitaSchemaCache | undefined = this.schemaCache.get(catalogName)
        if (schemaCacheForCatalog == undefined) {
            return
        }

        // we need a new session if we want to load a new schema version
        const sharedSession: EvitaClientSession | undefined = this.sharedSessions.get(catalogName)
        if (sharedSession != undefined) {
            this.closeSession(sharedSession)
        }

        if (entityType != undefined) {
            await schemaCacheForCatalog.removeLatestEntitySchema(entityType)
        } else {
            await schemaCacheForCatalog.removeLatestCatalogSchema()
        }
    }

    /**
     * Terminates active shared session for specified catalog name, if any active.
     * Any subsequent call to session will request new session.
     */
    async terminateSharedSession(catalogName: string): Promise<void> {
        const sharedSession: EvitaClientSession | undefined = this.sharedSessions.get(catalogName)
        if (sharedSession != undefined) {
            this.closeSession(sharedSession)
        }
    }
    async *duplicateCatalogWithProgress(catalogName: string, newCatalogName: string): AsyncIterable<ApplyMutationWithProgressResponse> {
        for await (const progress of this.evitaClient.duplicateCatalogWithProgress({
            catalogName,
            newCatalogName
        })) {
            yield this.mutationProgressConverter.convertMutationWithProgress(progress)
        }
    }

    async *renameCatalogWithProgress(catalogName: string, newCatalogName: string): AsyncIterable<ApplyMutationWithProgressResponse> {
        for await (const progress of this.evitaClient.renameCatalogWithProgress({
            catalogName,
            newCatalogName
        })) {
            yield this.mutationProgressConverter.convertMutationWithProgress(progress)
        }
    }

    async *deactivateCatalogWithProgress(catalogName: string): AsyncIterable<ApplyMutationWithProgressResponse> {
        for await (const progress of this.evitaClient.deactivateCatalogWithProgress({
            catalogName
        })) {
            yield this.mutationProgressConverter.convertMutationWithProgress(progress)
        }
    }

    async *activateCatalogWithProgress(catalogName: string): AsyncIterable<ApplyMutationWithProgressResponse> {
        for await (const progress of this.evitaClient.activateCatalogWithProgress({
            catalogName
        })) {
            yield this.mutationProgressConverter.convertMutationWithProgress(progress)
        }
    }

    async *makeCatalogAliveWithProgress(catalogName: string): AsyncIterable<ApplyMutationWithProgressResponse> {
        for await (const progress of this.evitaClient.makeCatalogAliveWithProgress({ catalogName })){
            yield this.mutationProgressConverter.convertMutationWithProgress(progress)
        }
    }

    async *makeCatalogImmutableWithProgress(catalogName: string): AsyncIterable<ApplyMutationWithProgressResponse> {
        for await (const progress of this.evitaClient.makeCatalogImmutableWithProgress({ catalogName })){
            yield this.mutationProgressConverter.convertMutationWithProgress(progress)
        }
    }

    async *makeCatalogMutable(catalogName: string): AsyncIterable<ApplyMutationWithProgressResponse> {
        for await (const progress of this.evitaClient.makeCatalogMutableWithProgress({ catalogName })){
            yield this.mutationProgressConverter.convertMutationWithProgress(progress)
        }
    }

    async *replaceCatalogWithProgress(catalogNameToBeReplacedWith: string, catalogNameToBeReplaced: string):AsyncIterable<ApplyMutationWithProgressResponse> {
        for await (const progress of this.evitaClient.replaceCatalogWithProgress({catalogNameToBeReplacedWith, catalogNameToBeReplaced})) {
            yield this.mutationProgressConverter.convertMutationWithProgress(progress)
        }
    }

    /**
     * Opens a server-streaming subscription to engine-level (system) change-data-capture events:
     * catalog create/drop/rename/state/schema changes. The stream always requests the full change
     * body ({@link GrpcChangeCaptureContent.CHANGE_BODY}), which carries the catalog name required
     * for targeted cache invalidation.
     *
     * The first response is an acknowledgement (with heartbeat info), followed by change responses
     * (carrying a capture) and periodic heartbeat responses. The stream is expected to be consumed
     * by a single consumer ({@link DataCacheRefresher}); the caller can cancel it deterministically
     * via `options.signal`.
     *
     * @param options.sinceVersion resume the stream from the given engine version (replays mutations
     *        that happened during an outage)
     * @param options.sinceIndex resume from the given mutation index within `sinceVersion`
     * @param options.signal abort signal to cancel the stream
     */
    async *registerSystemChangeCapture(
        options?: {
            sinceVersion?: bigint,
            sinceIndex?: number,
            signal?: AbortSignal
        }
    ): AsyncIterable<RegisterSystemChangeCaptureResponse> {
        try {
            for await (const response of this.evitaClient.registerSystemChangeCapture(
                {
                    content: GrpcChangeCaptureContent.CHANGE_BODY,
                    sinceVersion: options?.sinceVersion,
                    sinceIndex: options?.sinceIndex
                },
                { signal: options?.signal }
            )) {
                yield this.registerSystemChangeCaptureResponseConverter.convert(response)
            }
        } catch (e) {
            throw this.errorTransformer.transformError(e)
        }
    }

    private getOrCreateSchemaCache(catalogName: string): EvitaSchemaCache {
        let entitySchemaCacheForSession: EvitaSchemaCache | undefined = this.schemaCache.get(catalogName)
        if (entitySchemaCacheForSession == undefined) {
            entitySchemaCacheForSession = new EvitaSchemaCache()
            this.schemaCache.set(catalogName, entitySchemaCacheForSession)
        }
        return entitySchemaCacheForSession
    }

    private async getOrCreateSharedSession(
        catalogName: string,
        readWrite: boolean,
        warmup: boolean,
        forceNewSession: boolean
    ): Promise<EvitaClientSession> {
        let sharedSession: EvitaClientSession | undefined = this.sharedSessions.get(catalogName)

        if (sharedSession != undefined && !sharedSession.isActive) {
            console.warn(`Session ${sharedSession.id} has been already closed but is still in the cache, that should not happen!. `)
            this.sharedSessions.delete(catalogName)
            sharedSession = undefined
        }

        if (sharedSession != undefined && forceNewSession) {
            this.closeSession(sharedSession)
            sharedSession = undefined
        }

        if (sharedSession == undefined) {
            // callers routinely fetch several schemas at once (a tab loads its own schema, the catalog schema
            // and the engine settings together), and they all miss the cache in the same tick. Without
            // single-flighting the creation, each of them opens its own session: on an alive catalog that
            // leaks all but the last one, and on a warming-up catalog - where evitaDB permits exactly one
            // session - every call after the first one fails outright.
            //
            // The in-flight entry is keyed by catalog name only, which relies on an invariant: every caller
            // that shares a session for a given catalog asks for the same `readWrite` mode (it is derived
            // from the catalog's warm-up state, not from the caller). A future caller that needs a different
            // mode must not join this queue - it has to open its own session.
            const sessionInCreation: Promise<EvitaClientSession> | undefined =
                this.sharedSessionsInCreation.get(catalogName)
            if (sessionInCreation != undefined) {
                return await sessionInCreation
            }

            // the in-flight entry must be registered in the very same tick the creation starts (no `await`
            // between the two statements below): `createSharedSession` may wait for an outstanding close on
            // a warming-up catalog, and a caller slipping in meanwhile would open a second session there,
            // which evitaDB refuses
            const creation: Promise<EvitaClientSession> = this.createSharedSession(catalogName, readWrite, warmup)
            this.sharedSessionsInCreation.set(catalogName, creation)
            try {
                return await creation
            } finally {
                this.sharedSessionsInCreation.delete(catalogName)
            }
        } else {
            return sharedSession
        }
    }

    /**
     * Creates a new session and installs it as the shared one for the catalog. On a warming-up catalog it
     * first waits for a previously evicted session to actually close, because evitaDB permits exactly one
     * open session on a non-transactional catalog.
     */
    private async createSharedSession(
        catalogName: string,
        readWrite: boolean,
        warmup: boolean
    ): Promise<EvitaClientSession> {
        if (warmup) {
            const closing: Promise<void> | undefined = this.sharedSessionsClosing.get(catalogName)
            if (closing != undefined) {
                await closing
            }
        }
        // because a session for warming up catalogs is shared, we need to create it in read-write mode to be able to
        // execute all operations
        const session: EvitaClientSession = await this.createSession(catalogName, readWrite)
        this.sharedSessions.set(catalogName, session)
        return session
    }

    private async createSession(catalogName: string,
                                readWrite: boolean = false): Promise<EvitaClientSession> {

        let newSession: GrpcEvitaSessionResponse
        if (readWrite) {
            newSession = await this.evitaClient
                .createReadWriteSession({ catalogName })
        } else {
            newSession = await this.evitaClient
                .createReadOnlySession({ catalogName })
        }

        return new EvitaClientSession(
            newSession.sessionId,
            catalogName,
            this.catalogStatisticsConverter.convertCatalogState(newSession.catalogState),
            this,
            this.getOrCreateSchemaCache(catalogName),
            () => this.errorTransformer,
            () => this.evitaSessionClient,
            () => this.evitaTrafficRecordingClient,
            () => this.evitaValueConverter,
            () => this.catalogSchemaConverter,
            () => this.responseConverter,
            () => this.taskStatusConverter,
            () => this.trafficRecordingConverter,
            () => this.mutationHistoryConverter
        )
    }

    /**
     * Evicts the session from the shared-session registry, so that no new caller can obtain it, and closes
     * it as soon as its in-flight callers are done. It never terminates a call that is already executing.
     *
     * The pending close is intentionally not awaited: a caller asking for fresh data must not block on an
     * unrelated slow query of somebody else. Warming-up catalogs are the exception and wait for it in
     * {@link createSharedSession}, because evitaDB permits a single open session there.
     */
    private closeSession(session: EvitaClientSession): void {
        const catalogName: string = session.catalogName
        // drop the entry first, and only when it is still *this* session - a concurrent creation may have
        // already installed a newer one that must not be lost
        if (this.sharedSessions.get(catalogName) === session) {
            this.sharedSessions.delete(catalogName)
        }
        this.trackSessionClosing(catalogName, session.closeWhenIdle())
    }

    /**
     * Remembers the pending close of a shared session of the catalog, chaining it after any close that is
     * still pending for the same catalog, and forgets it once finished.
     */
    private trackSessionClosing(catalogName: string, closing: Promise<void>): void {
        const previousClosing: Promise<void> | undefined = this.sharedSessionsClosing.get(catalogName)
        const chainedClosing: Promise<void> = previousClosing == undefined
            ? closing
            : previousClosing.then(() => closing)
        this.sharedSessionsClosing.set(catalogName, chainedClosing)
        void chainedClosing.then(() => {
            if (this.sharedSessionsClosing.get(catalogName) === chainedClosing) {
                this.sharedSessionsClosing.delete(catalogName)
            }
        })
    }
}
