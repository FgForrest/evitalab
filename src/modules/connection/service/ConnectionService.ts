import { InjectionKey } from 'vue'
import { ConnectionStore } from '@/modules/connection/store/connectionStore'
import { Connection } from '@/modules/connection/model/Connection'
import { LabStorage } from '@/modules/storage/LabStorage'
import { ConnectionId } from '@/modules/connection/model/ConnectionId'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { DuplicateConnectionError } from '@/modules/connection/exception/DuplicateConnectionError'
import { Catalog } from '@/modules/connection/model/Catalog'
import { CatalogSchema } from '@/modules/connection/model/schema/CatalogSchema'
import { EntitySchema } from '@/modules/connection/model/schema/EntitySchema'
import { mandatoryInject } from '@/utils/reactivity'
import { EvitaDBDriverResolver } from '@/modules/connection/driver/EvitaDBDriverResolver'
import { EvitaDBDriver } from '@/modules/connection/driver/EvitaDBDriver'
import Immutable from 'immutable'
import { ServerStatus } from '@/modules/connection/model/status/ServerStatus'
import { EvitaLabConfig } from '@/modules/config/EvitaLabConfig'
import { LabRunMode } from '@/LabRunMode'
import { ConnectionNotFoundError } from '@/modules/connection/error/ConnectionNotFoundError'

/**
 * Cookie containing preconfigured connections. These will be displayed next to the user-defined connections.
 */
const preconfiguredConnectionsSystemPropertyName: string = 'pconnections'
const userConnectionsStorageKey: string = 'userConnections'

export const connectionServiceInjectionKey: InjectionKey<ConnectionService> = Symbol('connectionService')

/**
 * Service that manages lifecycle of a whole evitaLab instance. It contains generic methods for accessing evitaDB servers
 * and so on.
 */
export class ConnectionService {
    private readonly evitaLabConfig: EvitaLabConfig
    private readonly store: ConnectionStore
    private readonly labStorage: LabStorage
    private readonly evitaDBDriverResolver: EvitaDBDriverResolver

    private readonly connectionDriverCache: Map<ConnectionId, EvitaDBDriver> = new Map()

    private constructor(evitaLabConfig: EvitaLabConfig, store: ConnectionStore, labStorage: LabStorage, evitaDBDriverResolver: EvitaDBDriverResolver) {
        this.evitaLabConfig = evitaLabConfig
        this.store = store
        this.labStorage = labStorage
        this.evitaDBDriverResolver = evitaDBDriverResolver
    }

    /**
     * Loads data and initializes connection manager
     */
    static load(store: ConnectionStore,
                evitaLabConfig: EvitaLabConfig,
                labStorage: LabStorage,
                evitaDBDriverResolver: EvitaDBDriverResolver): ConnectionService {
        let preconfiguredConnections: Connection[] = []
        // load preconfigured connections from cookie from hosted evitaDB instance

        const preconfiguredConnectionsSystemProperty: string | undefined =
            evitaLabConfig.systemProperty(preconfiguredConnectionsSystemPropertyName)
        if (preconfiguredConnectionsSystemProperty != undefined) {
            try {
                preconfiguredConnections = (JSON.parse(preconfiguredConnectionsSystemProperty) as Array<any>)
                    .map(connection => Connection.preconfiguredFromJson(connection))
                // todo validate duplicate connections, move this to Lab component to have access to Toaster
            } catch (e) {
                console.error('Failed to load preconfigured connections from system properties', e)
            }
        }
        // automatic demo connection configuration for easier development
        if (import.meta.env.DEV) {
            if (evitaLabConfig.runMode === LabRunMode.Standalone) {
                preconfiguredConnections.push(Connection.preconfigured(
                    'dev-demo',
                    'Demo (dev)',
                    'https://demo.evitadb.io'
                ))
                preconfiguredConnections.push(Connection.preconfigured(
                    'dev-localhost',
                    'Localhost (dev)',
                    'http://localhost:5555'
                ))
            } else if (evitaLabConfig.runMode === LabRunMode.Driver) {
                if (preconfiguredConnections.length === 0) {
                    preconfiguredConnections.push(Connection.preconfigured(
                        'dev-demo',
                        'Demo (dev)',
                        'https://demo.evitadb.io'
                    ))
                }
            }
        }

        // load user-defined connections from local storage
        const userConnections: Connection[] = labStorage.get(userConnectionsStorageKey, [])
            .map((it: any) => Connection.userFromJson(it))

        // inject connections into the lab
        store.replacePreconfiguredConnections(preconfiguredConnections)
        store.replaceUserConnections(userConnections)

        return new ConnectionService(evitaLabConfig, store, labStorage, evitaDBDriverResolver)
    }

    /**
     * Returns specific connection (either preconfigured or user one)
     */
    getConnection(id: ConnectionId): Connection {
        const connection: Connection | undefined = this.store.connections
            .find(c => c.id === id) as Connection | undefined
        if (connection == undefined) {
            throw new ConnectionNotFoundError(id)
        }
        return connection
    }

    /**
     * Returns all connections: preconfigured and user ones.
     */
    getConnections(): Immutable.List<Connection> {
        return this.store.connections
    }

    /**
     * Returns single connection if in driver mode. Driver mode requires exactly one connection.
     */
    getDriverConnection(): Connection {
        if (this.evitaLabConfig.runMode !== LabRunMode.Driver) {
            throw new UnexpectedError('evitaLab is not in driver mode.')
        }
        const connections: Immutable.List<Connection> = this.getConnections()
        if (connections.size !== 1) {
            throw new UnexpectedError(`evitaLab in driver mode support exactly one connection only, found ${connections.size}.`)
        }
        return connections.get(0)!
    }

    isConnectionExists(connectionName: string): boolean {
        return this.store.connections.find(c => c.name === connectionName) != undefined
    }

    /**
     * Adds connection to UI and lab storage
     */
    addConnection(connection: Connection): void {
        if (this.isConnectionExists(connection.name)) {
            throw new DuplicateConnectionError(connection.name)
        }

        this.store.userConnections.push(connection)
        this.labStorage.set(userConnectionsStorageKey, this.store.userConnections)
    }

    /**
     * Removes connection from UI and lab storage
     */
    removeConnection(connectionId: ConnectionId): void {
        this.store.userConnections.splice(
            this.store.userConnections.findIndex(connection => connection.id === connectionId),
            1
        )
        this.labStorage.set(userConnectionsStorageKey, this.store.userConnections)
    }

    /**
     * Reloads all cached connection-related data.
     */
    async reload(connection: Connection): Promise<void> {
        // todo lho reloading catalogs doesnt work properly with reactivity because new map is created every time
        await this.getCatalogs(connection, true)
        await this.getServerStatus(connection, true)
    }

    /**
     * Returns cached server status with info about the server for a connection.
     * Can be reloaded and re-cached.
     */
    async getServerStatus(connection: Connection, forceReload: boolean = true): Promise<ServerStatus> {
        if (forceReload) {
            return await this.fetchAndCacheServerStatus(connection)
        }

        let serverStatus: ServerStatus | undefined = this.store.cachedServerStatuses.get(connection.id) as ServerStatus | undefined
        if (serverStatus == undefined) {
            serverStatus = await this.fetchAndCacheServerStatus(connection)
            this.store.cachedServerStatuses.set(connection.id, serverStatus)
        }
        return serverStatus
    }

    async closeAllSessions(connection: Connection, catalogName?: string): Promise<void> {
        (await this.getDriver(connection)).closeAllSessions(connection, catalogName)
    }

    /**
     * Returns cached catalog. If not present, it tries to fetch current catalog.
     */
    async getCatalog(connection: Connection, catalogName: string): Promise<Catalog> {
        let catalog: Catalog | undefined = this.store.cachedCatalogs.get(connection.id)?.get(catalogName) as Catalog
        if (catalog == undefined) {
            await this.fetchAndCacheCatalogs(connection)

            catalog = this.store.cachedCatalogs.get(connection.id)?.get(catalogName) as Catalog
            if (catalog == undefined) {
                throw new UnexpectedError(`Catalog '${catalogName}' not found for connection '${connection.name}'.`)
            }
        }
        return catalog
    }

    async getCatalogs(connection: Connection, forceReload?: boolean): Promise<Immutable.List<Catalog>> {
        const cachedCatalogs: IterableIterator<Catalog> | undefined = this.store.cachedCatalogs.get(connection.id)?.values() as IterableIterator<Catalog>
        if (cachedCatalogs == undefined || forceReload === true) {
            await this.fetchAndCacheCatalogs(connection)
            return Immutable.List(this.store.catalogs(connection.id))
        } else {
            return Immutable.List(this.store.catalogs(connection.id))
        }
    }

    async getCatalogSchema(connection: Connection, catalogName: string): Promise<CatalogSchema> {
        let catalogSchema: CatalogSchema | undefined = this.store.cachedCatalogSchemas.get(connection.id)?.get(catalogName) as CatalogSchema
        if (catalogSchema == undefined) {
            catalogSchema = await this.fetchAndCacheCatalogSchema(connection, catalogName)
        }
        return catalogSchema
    }

    async getEntitySchema(connetion: Connection, catalogName: string, entityType: string): Promise<EntitySchema> {
        const catalogSchema: CatalogSchema = await this.getCatalogSchema(connetion, catalogName)
        const entitySchema: EntitySchema | undefined = (await catalogSchema.entitySchemas())
            .getIfSupported()
            ?.get(entityType)
        if (entitySchema == undefined) {
            throw new UnexpectedError(`Entity '${entityType}' not found in catalog '${catalogName}'.`)
        }
        return entitySchema
    }

    private async fetchAndCacheServerStatus(connection: Connection): Promise<ServerStatus> {
        const driver: EvitaDBDriver = await this.getDriver(connection)
        const serverStatus: ServerStatus = await driver.getServerStatus(connection)
        this.store.cachedServerStatuses.set(connection.id, serverStatus)
        return serverStatus
    }

    private async fetchAndCacheCatalogs(connection: Connection): Promise<Catalog[]> {
        const fetchedCatalogs: Catalog[] = await (await this.getDriver(connection)).getCatalogs(connection)
        this.store.cachedCatalogs.set(
            connection.id,
            new Map<string, Catalog>(fetchedCatalogs.map(catalog => {
                return [catalog.name, catalog]
            }))
        )
        return Array.from(this.store.cachedCatalogs.get(connection.id)!.values())
    }

    private async fetchAndCacheCatalogSchema(connection: Connection, catalogName: string): Promise<CatalogSchema> {
        const catalog: Catalog = await this.getCatalog(connection, catalogName)

        const fetchedCatalogSchema: CatalogSchema = await (await this.getDriver(connection)).getCatalogSchema(connection, catalog.name)
        this.store.cachedCatalogSchemas.set(
            connection.id,
            new Map<string, CatalogSchema>([[fetchedCatalogSchema.name, fetchedCatalogSchema]])
        )
        return fetchedCatalogSchema
    }

    async getDriver(connection: Connection): Promise<EvitaDBDriver> {
        let cachedDriver: EvitaDBDriver | undefined = this.connectionDriverCache.get(connection.id)
        if (cachedDriver == undefined) {
            cachedDriver = await this.evitaDBDriverResolver.resolveDriver(connection)
            this.connectionDriverCache.set(connection.id, cachedDriver)
        }
        return cachedDriver
    }
}

export const useConnectionService = (): ConnectionService => {
    return mandatoryInject(connectionServiceInjectionKey) as ConnectionService
}
