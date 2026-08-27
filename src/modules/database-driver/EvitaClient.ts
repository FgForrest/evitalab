import {
    AbstractEvitaClient,
    defaultCallTimeout,
    unboundedStreamOptions,
    userQueryTimeout
} from '@/modules/database-driver/AbstractEvitaClient'
import type { KyInstance } from 'ky'
import type {
    GrpcCatalogNamesResponse,
    GrpcDefineCatalogResponse,
    GrpcEvitaSessionResponse
} from '@/modules/database-driver/connector/grpc/gen/GrpcEvitaAPI_pb'
import { EvitaClientSession, type MaterializedSession } from '@/modules/database-driver/EvitaClientSession'
import { Code, ConnectError } from '@connectrpc/connect'
import { EvitaClientManagement } from '@/modules/database-driver/EvitaClientManagement'
import { EvitaSchemaCache } from '@/modules/database-driver/EvitaSchemaCache'
import { GraphQLSchemaCache } from '@/modules/database-driver/GraphQLSchemaCache'
import { buildClientSchema, getIntrospectionQuery, GraphQLSchema, type IntrospectionQuery } from 'graphql'
import { Set } from 'immutable'
import type { InjectionKey, Ref } from 'vue'
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
import { CatalogState } from '@/modules/database-driver/request-response/CatalogState.ts'
import type { LabServerDataCache } from '@/modules/storage/LabServerDataCache'
import { PersistentCacheLayer } from '@/modules/database-driver/cache/PersistentCacheLayer'
import { CacheInvalidationReason } from '@/modules/database-driver/cache/CacheInvalidationReason'
import { DataFreshness } from '@/modules/database-driver/model/DataFreshness'
import { serverUnreachableState } from '@/modules/database-driver/model/serverConnectivity'
import type { CatalogSchema } from '@/modules/database-driver/request-response/schema/CatalogSchema'
import type { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'

export const evitaClientInjectionKey: InjectionKey<EvitaClient> = Symbol('EvitaClient')

/**
 * Describes how a piece of logic is to be executed against the shared session of a single catalog.
 * Passed as an object on purpose: the flags are all booleans, and a positional signature would let
 * a refactoring shift them unnoticed.
 */
interface SharedSessionExecution {
    readonly catalogName: string
    /**
     * State of the catalog as the client currently knows it. Seeds the session shell, which cannot ask the
     * server for it before it materializes.
     */
    readonly catalogState: CatalogState
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
    private _graphQLSchemaCache?: GraphQLSchemaCache
    private _management?: EvitaClientManagement
    /**
     * On-disk second level of every cache below.
     *
     * Unconditional: a browser that refuses storage does **not** show up as a missing layer, because
     * {@link LabServerDataCache} absorbs that itself — it reports {@link LabServerDataCache.usable} and degrades
     * every operation to a no-op. There is therefore no such thing as a client without persistence, only one
     * whose persistence does not work.
     */
    private readonly _persistentCacheLayer: PersistentCacheLayer
    /**
     * The storage the layer above writes to, kept so its usability can be reported.
     */
    private readonly _persistentCache: LabServerDataCache

    /**
     * We don't want to create a session for each UI call to evita. Both server resources and network workload are
     * saved by this. Also, most calls represent fetching a schema that are cached locally anyway.
     * @private
     */
    private readonly sharedSessions: Map<string, EvitaClientSession> = new Map()
    /**
     * Pending closes of shared sessions that still had in-flight callers when they were evicted, keyed by
     * catalog name. Only warming-up catalogs have to wait for them, because evitaDB permits a single
     * open session there.
     */
    private readonly sharedSessionsClosing: Map<string, Promise<void>> = new Map()

    constructor(evitaLabConfig: EvitaLabConfig,
                connectionService: ConnectionService,
                persistentCache: LabServerDataCache) {
        super(evitaLabConfig, connectionService)
        this._persistentCache = persistentCache
        this._persistentCacheLayer = new PersistentCacheLayer(
            persistentCache,
            () => this,
            () => this.catalogSchemaConverter,
            () => this.catalogStatisticsConverter
        )
    }

    /**
     * On-disk second level of the client caches.
     */
    get persistentCacheLayer(): PersistentCacheLayer {
        return this._persistentCacheLayer
    }

    /**
     * Whether evitaLab is able to persist server data on disk at all. `false` when the browser refuses storage
     * (see {@link LabServerDataCache} for which cases those are) — the status bar badges it, and the application
     * otherwise behaves exactly as an in-memory-only one.
     *
     * Reactive because a working cache can break at any point: the browser may reclaim storage or the user may
     * clear site data while evitaLab is open.
     */
    get persistentCacheAvailable(): Readonly<Ref<boolean>> {
        return this._persistentCache.usable
    }

    /**
     * Reactive signal telling whether what the client currently serves has been verified against the server.
     * The UI badges {@link DataFreshness.Cached} uniformly; no per-read metadata is (or should be) exposed.
     *
     * Without persistence nothing is ever restored from disk, so this is permanently
     * {@link DataFreshness.Live}.
     */
    get dataFreshness(): Ref<DataFreshness> {
        return this._persistentCacheLayer.dataFreshness
    }

    /**
     * Reactive count of restored values that could not be verified against the server. Feeds the badge's
     * tooltip.
     */
    get unverifiedCachedRecordCount(): Ref<number> {
        return this._persistentCacheLayer.unverifiedRecordCount
    }

    /**
     * Reactive "evitaLab is offline" state: whether the server is currently unreachable, as observed by the
     * driver's own failure and success funnels. Distinct from {@link dataFreshness}, which is about whether the
     * *data on screen* has been verified — the two answer different questions and can differ (an unreachable
     * server with nothing cached is offline with fully verified data).
     */
    get serverUnreachable(): Readonly<Ref<boolean>> {
        return serverUnreachableState()
    }

    /**
     * Discards everything evitaLab has persisted about this server, and the in-memory copies with it, so the
     * next read goes to the server. Backs the explicit "Clear local cache" user action — no data path depends
     * on it, and evitaLab simply starts cold next time.
     *
     * The purge is attempted even when persistence has broken, because storage that worked earlier may still
     * hold records the user is asking to be rid of.
     *
     * @return whether evitaLab is able to persist anything at all — `false` means the purge could not have had
     *         anything to do, and the caller should not claim success
     */
    async clearPersistentCache(): Promise<boolean> {
        await this._persistentCacheLayer.clear()
        // the in-memory copies would otherwise keep serving exactly what was just purged from disk
        await this.clearCache(CacheInvalidationReason.MemoryOnly)
        return this.persistentCacheAvailable.value
    }

    /**
     * The client every HTTP call to the evitaDB server must go through: it carries evitaLab's timeout and,
     * more importantly, the hook that observes the server answering. Raw `ky` bypasses both, which leaves the
     * offline state latched after a transient failure on a purely HTTP workload.
     *
     * Exposed for {@link EvitaClientManagement}, which lives outside the class hierarchy holding it.
     */
    get httpClient(): KyInstance {
        return this.httpApiClient
    }

    private get graphQLSchemaCache(): GraphQLSchemaCache {
        if (this._graphQLSchemaCache == undefined) {
            this._graphQLSchemaCache = new GraphQLSchemaCache(this._persistentCacheLayer.graphQLSchemaCache())
        }
        return this._graphQLSchemaCache
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
                await this.discardCatalogCaches(catalogName)
                await this.discardCatalogCaches(newCatalogName)
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
                await this.discardCatalogCaches(catalogNameToBeReplaced)
                await this.discardCatalogCaches(catalogNameToBeReplacedWith)
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
                await this.discardCatalogCaches(catalogName)
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
                    catalogState: catalog.catalogState,
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

    /**
     * Executes a GraphQL document against one of the GraphQL API instances.
     *
     * Defaults to {@link userQueryTimeout} because this is *semantically* the user-query method — its only
     * callers outside this class are the GraphQL console and the entity grid, both of which run documents the
     * user wrote. The one internal caller that does not ({@link fetchGraphQLIntrospection}) opts back down to
     * {@link defaultCallTimeout}, which keeps the timeout classification inside the driver instead of pushing
     * it out into UI services.
     */
    async queryCatalogUsingGraphQL(
        catalogName: string,
        instanceType: GraphQLInstanceType,
        query: string,
        variables: Record<string, unknown> = {},
        timeout: number = userQueryTimeout
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
                        timeout
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
     * the cached {@link GraphQLSchema}. The introspection request is bounded by
     * {@link defaultCallTimeout} like any other metadata call.
     */
    async getGraphQLSchema(
        catalogName: string,
        instanceType: GraphQLInstanceType
    ): Promise<GraphQLSchema> {
        return this.graphQLSchemaCache.getSchema(catalogName, instanceType, async () => {
            const introspection: IntrospectionQuery = await this.fetchGraphQLIntrospection(
                catalogName,
                instanceType
            )
            const introspectionHash: string = this._persistentCacheLayer
                .persistGraphQLIntrospection(catalogName, instanceType, introspection)
            return { schema: buildClientSchema(introspection), introspectionHash }
        })
    }

    /**
     * Re-runs the GraphQL introspection and, **only when the result really differs** from the one the currently
     * cached schema was built from, rebuilds it and fires the GraphQL schema change callbacks. Backs the
     * console's manual "Reload GraphQL schema" action.
     *
     * Fetch-first, exactly like {@link refreshCatalogSchema}: a reload that cannot reach the server keeps the
     * schema the console is browsing and propagates the error instead of clearing the cache. Comparison is by
     * hash of the raw introspection result, the only version information the GraphQL API offers, and against
     * the **in-memory** schema — the one the consoles are displaying, which is what the user asked about.
     * Anything else in memory (nothing cached, or a schema of unknown provenance) rebuilds: a silent no-op is
     * the one answer a manual reload must never give.
     *
     * @return whether the cached schema was replaced
     */
    async refreshGraphQLSchema(
        catalogName: string,
        instanceType: GraphQLInstanceType
    ): Promise<boolean> {
        const introspection: IntrospectionQuery = await this.fetchGraphQLIntrospection(
            catalogName,
            instanceType
        )
        // the disk copy is updated regardless of the outcome: it is now provably the current one
        const freshHash: string = this._persistentCacheLayer
            .persistGraphQLIntrospection(catalogName, instanceType, introspection)

        // read **after** the fetch, exactly like refreshCatalogSchema compares at swap time: this method is
        // also the revalidation a disk-served read schedules, and that revalidation starts *while* the
        // hydrated schema is still on its way into the cache. Reading the hash up front would see nothing
        // cached and swap a schema identical to the one being installed, firing the callbacks of every open
        // console on every reload.
        const displayedHash: string | undefined = this.graphQLSchemaCache
            .cachedIntrospectionHash(catalogName, instanceType)

        if (freshHash === displayedHash) {
            return false
        }

        await this.graphQLSchemaCache.refresh(
            catalogName,
            instanceType,
            { schema: buildClientSchema(introspection), introspectionHash: freshHash }
        )
        return true
    }

    /**
     * Runs a GraphQL introspection query against an API instance and returns its raw result. Persisting is left
     * to the caller: the two callers need the resulting hash differently (see {@link refreshGraphQLSchema}), and
     * the raw introspection — not the built schema — is what gets persisted.
     */
    private async fetchGraphQLIntrospection(
        catalogName: string,
        instanceType: GraphQLInstanceType
    ): Promise<IntrospectionQuery> {
        const response: GraphQLResponse = await this.queryCatalogUsingGraphQL(
            catalogName,
            instanceType,
            getIntrospectionQuery(),
            {},
            // introspection is metadata, not a user query, so it opts down to the short default
            defaultCallTimeout
        )
        return response.data as IntrospectionQuery
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
     * catalog-schema callbacks).
     *
     * The console's manual "Reload GraphQL schema" action uses {@link refreshGraphQLSchema} instead — this
     * funnel is for callers that know the schema changed (and must therefore state whether the persisted
     * introspection is stale too).
     */
    async clearGraphQLSchemaCache(
        catalogName: string,
        instanceType: GraphQLInstanceType,
        reason: CacheInvalidationReason
    ): Promise<void> {
        await this.graphQLSchemaCache.clear(catalogName, instanceType, reason)
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
                        catalogState: catalog.catalogState,
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
                    session = this.createSession(catalogName, catalog.catalogState, true, false)
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
            session = this.getOrCreateSharedSession(
                catalogName,
                execution.catalogState,
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
                () => this.taskStatusConverter,
                () => this._persistentCacheLayer
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
     * Clears all client cache (statistics, schemas, ...). The blunt instrument every caller reaches for that
     * cannot say precisely what it invalidated.
     *
     * @param reason decides the fate of the **persisted** copies, and the two intents are genuinely different:
     *
     * - {@link CacheInvalidationReason.MemoryOnly} — a reachability-driven reset (the connection panel's
     *   reload action, a recovering server). It is no evidence that anything changed, and dropping the disk
     *   copies would destroy exactly the data that makes evitaLab usable while the server is unreachable.
     *   Freshness is restored by the background revalidation every disk-served read schedules.
     * - {@link CacheInvalidationReason.ChangeEvidence} — evitaLab has just mutated the database itself. The
     *   persisted copies go too, so the next read fetches rather than serving data that is known to be
     *   outdated. Because this funnel is catalog-agnostic it also discards persisted data of catalogs the
     *   mutation did not concern; that is deliberate collateral — these operations are rare, explicitly
     *   user-triggered, and the server is provably reachable, so the discarded data is simply re-fetched on
     *   demand. The persisted purge is wholesale **by store**, so it covers the catalogs that are only on
     *   disk as well, not merely those whose caches this session happens to hold.
     */
    async clearCache(reason: CacheInvalidationReason): Promise<void> {
        // this is the "make everything current again" action, so anything that could not be verified against the
        // server earlier is due for another attempt right away. The invalidations below re-verify whatever they
        // drop as soon as it is read again, but a value that stayed in memory is never read from disk and would
        // therefore keep a stale-data badge lit with nothing to clear it
        this._persistentCacheLayer.resetRevalidationState()
        if (this._management != undefined) {
            // refresh the server status first: it is the reachability signal consumers rely on to
            // decide whether reloading catalog-level data is even worth attempting
            await this.management.clearServerMetadataCache()
            await this.management.clearCatalogStatisticsCache(reason)
        }
        // we need a new session if we want to load a new data
        for (const sharedSession of this.sharedSessions.values()) {
            this.closeSession(sharedSession)
        }
        if (reason === CacheInvalidationReason.ChangeEvidence) {
            // by store, not per cached catalog: the loop below only knows the catalogs whose schema was read
            // this session, while on disk the records of every catalog ever read are still there - and just as
            // outdated
            await this._persistentCacheLayer.deleteAllSchemas()
        }
        const cachedCatalogs: IterableIterator<string> = this.schemaCache.keys()
        for (const cachedCatalog of cachedCatalogs) {
            // the persisted side was already handled wholesale above, so this only has to drop memory
            await this.schemaCache.get(cachedCatalog)!.removeLatestCatalogSchema(CacheInvalidationReason.MemoryOnly)
        }
        // the GraphQL schema cache tracks its own (catalog, instanceType) keys that need not overlap
        // with the internal schema cache above, so clear it through its own funnel
        await this.graphQLSchemaCache.clearAll(reason)
    }

    /**
     * Clears schema caches. The next schema fetch will provide the latest schema.
     *
     * **Reserved for change evidence** — a change-data-capture notification or a mutation evitaLab performed
     * itself. It drops the persisted copies too, which is only correct when the data provably changed. UI
     * "reload" buttons must use {@link refreshCatalogSchema} / {@link refreshEntitySchema} instead: those
     * fetch first and keep the current data when the fetch fails, whereas this method would leave a user who
     * pressed reload while offline with nothing at all.
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
            await this.graphQLSchemaCache.clearForCatalog(catalogName, CacheInvalidationReason.ChangeEvidence)
        }

        const schemaCacheForCatalog: EvitaSchemaCache | undefined = this.schemaCache.get(catalogName)
        if (schemaCacheForCatalog == undefined) {
            // no in-memory cache exists for the catalog, but a persisted copy from an earlier run may well
            // do - and it is just as stale
            if (entityType != undefined) {
                await this._persistentCacheLayer.schemaCache(catalogName).deleteEntitySchema(entityType)
            } else {
                await this._persistentCacheLayer.deleteCatalogData(catalogName)
            }
            return
        }

        // we need a new session if we want to load a new schema version
        const sharedSession: EvitaClientSession | undefined = this.sharedSessions.get(catalogName)
        if (sharedSession != undefined) {
            this.closeSession(sharedSession)
        }

        if (entityType != undefined) {
            await schemaCacheForCatalog.removeLatestEntitySchema(CacheInvalidationReason.ChangeEvidence, entityType)
        } else {
            await schemaCacheForCatalog.removeLatestCatalogSchema(CacheInvalidationReason.ChangeEvidence)
        }
    }

    /**
     * Fetches the catalog schema from the server and, **only when it really differs** from the one currently
     * cached, replaces it and fires the catalog-schema change callbacks. Backs the schema viewer's manual
     * reload button.
     *
     * Fetch-first on purpose: nothing is dropped before fresh data is in hand, so a reload that cannot reach
     * the server leaves the displayed schema untouched and simply propagates the error to the caller (which
     * reports it through its toaster). Identical data means "verified current" — no swap, no callbacks, no
     * re-render.
     *
     * @return whether the cached schema was replaced
     */
    async refreshCatalogSchema(catalogName: string): Promise<boolean> {
        try {
            const catalogSchema: CatalogSchema = await this.queryCatalog(
                catalogName,
                async (session) => await session.fetchLatestCatalogSchema()
            )
            return await this.getOrCreateSchemaCache(catalogName).refreshLatestCatalogSchema(catalogSchema)
        } catch (e) {
            throw this.errorTransformer.transformError(e)
        }
    }

    /**
     * Fetches an entity schema from the server and, only when it really differs from the one currently cached,
     * replaces it and fires the entity-schema change callbacks. The entity-level counterpart of
     * {@link refreshCatalogSchema}.
     *
     * @return whether the cached schema was replaced
     */
    async refreshEntitySchema(catalogName: string, entityType: string): Promise<boolean> {
        try {
            const entitySchema: EntitySchema | undefined = await this.queryCatalog(
                catalogName,
                async (session) => await session.fetchLatestEntitySchema(entityType)
            )
            if (entitySchema == undefined) {
                // the collection no longer exists; that is change evidence, not a refresh
                await this.clearSchemaCache(catalogName, entityType)
                return true
            }
            return await this.getOrCreateSchemaCache(catalogName).refreshLatestEntitySchema(entitySchema)
        } catch (e) {
            throw this.errorTransformer.transformError(e)
        }
    }

    /**
     * Drops every cache of a catalog, in memory and on disk. Used by the catalog-level mutations that discard
     * the whole per-catalog cache object rather than invalidating it through the cache — without this the
     * persisted records of a renamed or deleted catalog would survive and be served by the next read.
     */
    private async discardCatalogCaches(catalogName: string): Promise<void> {
        // the shared session captured the cache object at construction, so dropping the entry below is not
        // enough - the session would keep answering from the very cache we are discarding. Its catalog has
        // just been renamed away, replaced or deleted, so the session is worthless anyway.
        const sharedSession: EvitaClientSession | undefined = this.sharedSessions.get(catalogName)
        if (sharedSession != undefined) {
            this.closeSession(sharedSession)
        }
        this.schemaCache.delete(catalogName)
        await this._persistentCacheLayer.deleteCatalogData(catalogName)
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
        for await (const progress of this.evitaClient.duplicateCatalogWithProgress(
            {
                catalogName,
                newCatalogName
            },
            unboundedStreamOptions
        )) {
            yield this.mutationProgressConverter.convertMutationWithProgress(progress)
        }
    }

    async *renameCatalogWithProgress(catalogName: string, newCatalogName: string): AsyncIterable<ApplyMutationWithProgressResponse> {
        for await (const progress of this.evitaClient.renameCatalogWithProgress(
            {
                catalogName,
                newCatalogName
            },
            unboundedStreamOptions
        )) {
            yield this.mutationProgressConverter.convertMutationWithProgress(progress)
        }
    }

    async *deactivateCatalogWithProgress(catalogName: string): AsyncIterable<ApplyMutationWithProgressResponse> {
        for await (const progress of this.evitaClient.deactivateCatalogWithProgress(
            {
                catalogName
            },
            unboundedStreamOptions
        )) {
            yield this.mutationProgressConverter.convertMutationWithProgress(progress)
        }
    }

    async *activateCatalogWithProgress(catalogName: string): AsyncIterable<ApplyMutationWithProgressResponse> {
        for await (const progress of this.evitaClient.activateCatalogWithProgress(
            {
                catalogName
            },
            unboundedStreamOptions
        )) {
            yield this.mutationProgressConverter.convertMutationWithProgress(progress)
        }
    }

    async *makeCatalogAliveWithProgress(catalogName: string): AsyncIterable<ApplyMutationWithProgressResponse> {
        for await (const progress of this.evitaClient.makeCatalogAliveWithProgress({ catalogName }, unboundedStreamOptions)){
            yield this.mutationProgressConverter.convertMutationWithProgress(progress)
        }
    }

    async *makeCatalogImmutableWithProgress(catalogName: string): AsyncIterable<ApplyMutationWithProgressResponse> {
        for await (const progress of this.evitaClient.makeCatalogImmutableWithProgress({ catalogName }, unboundedStreamOptions)){
            yield this.mutationProgressConverter.convertMutationWithProgress(progress)
        }
    }

    async *makeCatalogMutable(catalogName: string): AsyncIterable<ApplyMutationWithProgressResponse> {
        for await (const progress of this.evitaClient.makeCatalogMutableWithProgress({ catalogName }, unboundedStreamOptions)){
            yield this.mutationProgressConverter.convertMutationWithProgress(progress)
        }
    }

    async *replaceCatalogWithProgress(catalogNameToBeReplacedWith: string, catalogNameToBeReplaced: string):AsyncIterable<ApplyMutationWithProgressResponse> {
        for await (const progress of this.evitaClient.replaceCatalogWithProgress(
            {catalogNameToBeReplacedWith, catalogNameToBeReplaced},
            unboundedStreamOptions
        )) {
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
                { ...unboundedStreamOptions, signal: options?.signal }
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
            entitySchemaCacheForSession = new EvitaSchemaCache(
                this._persistentCacheLayer.schemaCache(catalogName)
            )
            this.schemaCache.set(catalogName, entitySchemaCacheForSession)
        }
        return entitySchemaCacheForSession
    }

    /**
     * Returns the shared session of the catalog, creating a fresh session shell when there is none (or when
     * a new one was explicitly requested).
     *
     * **This method is deliberately synchronous.** A session shell needs no network, so it is installed into
     * the shared-session registry in the very same tick — which is what makes the registry itself the
     * single-flight: callers routinely fetch several schemas at once (a tab loads its own schema, the catalog
     * schema and the engine settings together) and all miss the registry in the same tick. Were there an
     * `await` before the installation below, each of them would install a session of its own: on an alive
     * catalog that leaks all but the last one, and on a warming-up catalog — where evitaDB permits exactly
     * one session — every call after the first one would fail outright. Deduplication of the *server* session
     * creation is a separate concern and lives inside the session itself.
     */
    private getOrCreateSharedSession(
        catalogName: string,
        catalogState: CatalogState,
        readWrite: boolean,
        warmup: boolean,
        forceNewSession: boolean
    ): EvitaClientSession {
        let sharedSession: EvitaClientSession | undefined = this.sharedSessions.get(catalogName)

        if (sharedSession != undefined && !sharedSession.isActive) {
            console.warn(`Session ${sharedSession.debugId} has been already closed but is still in the cache, that should not happen!. `)
            this.sharedSessions.delete(catalogName)
            sharedSession = undefined
        }

        if (sharedSession != undefined && forceNewSession) {
            this.closeSession(sharedSession)
            sharedSession = undefined
        }

        if (sharedSession == undefined) {
            return this.createSharedSession(catalogName, catalogState, readWrite, warmup)
        } else {
            return sharedSession
        }
    }

    /**
     * Creates a new session shell and installs it as the shared one for the catalog.
     */
    private createSharedSession(
        catalogName: string,
        catalogState: CatalogState,
        readWrite: boolean,
        warmup: boolean
    ): EvitaClientSession {
        // because a session for warming up catalogs is shared, we need to create it in read-write mode to be able to
        // execute all operations
        const session: EvitaClientSession = this.createSession(catalogName, catalogState, readWrite, warmup)
        this.sharedSessions.set(catalogName, session)
        return session
    }

    /**
     * Builds a session shell for the catalog. No server session is opened here — the shell does that itself
     * on the first call that genuinely needs the network (see {@link materializeSession}).
     */
    private createSession(catalogName: string,
                          catalogState: CatalogState,
                          readWrite: boolean,
                          warmup: boolean): EvitaClientSession {
        return new EvitaClientSession(
            catalogName,
            catalogState,
            () => this.materializeSession(catalogName, readWrite, warmup),
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
            () => this.mutationHistoryConverter,
            () => this._persistentCacheLayer
        )
    }

    /**
     * Opens the server-side session of a session shell. Called by the shell itself, at most once, on the
     * first call that genuinely needs the network.
     *
     * On a warming-up catalog it first waits for a previously evicted session to actually close, because
     * evitaDB permits exactly one open session on a non-transactional catalog. The wait sits here rather
     * than at shell creation on purpose: the constraint concerns open *server* sessions, so it has to be
     * honoured at the moment one is opened.
     */
    private async materializeSession(catalogName: string,
                                     readWrite: boolean,
                                     warmup: boolean): Promise<MaterializedSession> {
        if (warmup) {
            const closing: Promise<void> | undefined = this.sharedSessionsClosing.get(catalogName)
            if (closing != undefined) {
                await closing
            }
        }

        let newSession: GrpcEvitaSessionResponse
        if (readWrite) {
            newSession = await this.evitaClient
                .createReadWriteSession({ catalogName })
        } else {
            newSession = await this.evitaClient
                .createReadOnlySession({ catalogName })
        }

        return {
            sessionId: newSession.sessionId,
            catalogState: this.catalogStatisticsConverter.convertCatalogState(newSession.catalogState)
        }
    }

    /**
     * Evicts the session from the shared-session registry, so that no new caller can obtain it, and closes
     * it as soon as its in-flight callers are done. It never terminates a call that is already executing.
     *
     * The pending close is intentionally not awaited: a caller asking for fresh data must not block on an
     * unrelated slow query of somebody else. Warming-up catalogs are the exception and wait for it in
     * {@link materializeSession}, because evitaDB permits a single open session there.
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
