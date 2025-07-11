import { AbstractEvitaClient } from '@/modules/database-driver/AbstractEvitaClient'
import type {
    GrpcCatalogNamesResponse,
    GrpcDefineCatalogResponse,
    GrpcEvitaSessionResponse,
    GrpcGetCatalogStateResponse
} from '@/modules/database-driver/connector/grpc/gen/GrpcEvitaAPI_pb'
import { EvitaClientSession } from '@/modules/database-driver/EvitaClientSession'
import { Code, ConnectError } from '@connectrpc/connect'
import { CatalogState } from '@/modules/database-driver/request-response/CatalogState'
import { EvitaClientManagement } from '@/modules/database-driver/EvitaClientManagement'
import { EvitaSchemaCache } from '@/modules/database-driver/EvitaSchemaCache'
import { Set } from 'immutable'
import type { InjectionKey } from 'vue'
import { mandatoryInject } from '@/utils/reactivity'
import { GraphQLInstanceType } from '@/modules/graphql-console/console/model/GraphQLInstanceType'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import type { GraphQLResponse } from '@/modules/database-driver/connector/gql/model/GraphQLResponse'
import { EvitaLabConfig } from '@/modules/config/EvitaLabConfig'
import { ConnectionService } from '@/modules/connection/service/ConnectionService'
import { CatalogStatistics } from '@/modules/database-driver/request-response/CatalogStatistics'

export const evitaClientInjectionKey: InjectionKey<EvitaClient> = Symbol('EvitaClient')

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
    private _management?: EvitaClientManagement

    /**
     * We don't want to create a session for each UI call to evita. Both server resources and network workload are
     * saved by this. Also, most calls represent fetching a schema that are cached locally anyway.
     * @private
     */
    private readonly sharedSessions: Map<string, EvitaClientSession> = new Map()

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
                catalogName,
                queryLogic,
                catalog.isInWarmup,
                // there is no point in forcing a new session in the warming up mode, in the warming up mode all mutations
                // are visible everywhere, because there is only one shared session
                catalog.isInWarmup ? false : forceNewSession,
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
        variables: any = {}
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
                        })
                    }
                )
                    .json()
            ) as GraphQLResponse
        } catch (e: any) {
            throw this.errorTransformer.transformError(e)
        }
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
                    catalogName,
                    updateLogic,
                    true,
                    false,
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

    private async executeInSharedSession<T>(
        catalogName: string,
        logic: (session: EvitaClientSession) => Promise<T>,
        readWrite: boolean,
        forceNewSession: boolean,
        retryOnSessionClosed: boolean
    ): Promise<T> {
        let session: EvitaClientSession | undefined = undefined
        try {
            session = await this.getOrCreateSharedSession(catalogName, readWrite, forceNewSession)
            return await logic(session)
        } catch (e) {
            // the cached session was closed by the server
            if (e instanceof ConnectError && e.code === Code.Unauthenticated) {
                // noinspection PointlessBooleanExpressionJS
                if (session != undefined) {
                    await this.closeSession(session)
                }

                if (retryOnSessionClosed) {
                    // retry once with a new session
                    return await this.executeInSharedSession(catalogName, logic, readWrite, forceNewSession, false)
                } else {
                    throw new Error('Could not get active shared session on second retry. Giving up...')
                }
            }
            throw e
        }
    }

    async closeSharedSession(catalogName: string): Promise<void> {
        const sharedSession: EvitaClientSession | undefined = this.sharedSessions.get(catalogName)
        if (sharedSession != undefined) {
            await this.closeSession(sharedSession)
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
                () => this.evitaValueConverter,
                () => this.catalogStatisticsConverter,
                () => this.serverStatusConverter,
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
            await this.management.clearCatalogStatisticsCache()
        }
        // we need a new session if we want to load a new data
        for (const sharedSession of this.sharedSessions.values()) {
            await this.closeSession(sharedSession)
        }
        const cachedCatalogs: IterableIterator<string> = this.schemaCache.keys()
        for (const cachedCatalog of cachedCatalogs) {
            await this.schemaCache.get(cachedCatalog)!.removeLatestCatalogSchema()
        }
    }

    /**
     * Clears schema caches. The next schema fetch will provide the latest schema.
     *
     * @param catalogName for which catalog to clear schemas
     * @param entityType if undefined, entire catalog cache is cleared; otherwise only entity schema for a specified
     *                  entity type is cleared
     */
    async clearSchemaCache(catalogName: string, entityType?: string): Promise<void> {
        const schemaCacheForCatalog: EvitaSchemaCache | undefined = this.schemaCache.get(catalogName)
        if (schemaCacheForCatalog == undefined) {
            return
        }

        // we need a new session if we want to load a new schema version
        const sharedSession: EvitaClientSession | undefined = this.sharedSessions.get(catalogName)
        if (sharedSession != undefined) {
            await this.closeSession(sharedSession)
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
            await this.closeSession(sharedSession)
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
        forceNewSession: boolean
    ): Promise<EvitaClientSession> {
        let sharedSession: EvitaClientSession | undefined = this.sharedSessions.get(catalogName)

        if (sharedSession != undefined && !sharedSession.isActive) {
            console.warn(`Session ${sharedSession.id} has been already closed but is still in the cache, that should not happen!. `)
            this.sharedSessions.delete(catalogName)
            sharedSession = undefined
        }

        if (sharedSession != undefined && forceNewSession) {
            await this.closeSession(sharedSession)
            sharedSession = undefined
        }

        if (sharedSession == undefined) {
            // because a session for warming up catalogs is shared, we need to create it in read-write mode to be able to
            // execute all operations
            const session: EvitaClientSession = await this.createSession(catalogName, readWrite)
            this.sharedSessions.set(catalogName, session)
            return session
        } else {
            return sharedSession
        }
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
            () => this.trafficRecordingConverter
        )
    }

    private async closeSession(session: EvitaClientSession): Promise<void> {
        const catalogName: string = session.catalogName
        await session.close()
        this.sharedSessions.delete(catalogName)
    }
}
