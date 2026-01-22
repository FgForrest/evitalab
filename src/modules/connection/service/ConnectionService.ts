import type { InjectionKey } from 'vue'
import { Connection, type ConnectionJson } from '@/modules/connection/model/Connection'
import type { ConnectionId } from '@/modules/connection/model/ConnectionId'
import { mandatoryInject } from '@/utils/reactivity'
import { EvitaLabConfig } from '@/modules/config/EvitaLabConfig'
import { ConnectionNotFoundError } from '@/modules/connection/exception/ConnectionNotFoundError'

/**
 * Deprecated: only for backward compatibility, use `connectionSystemPropertyName` instead
 *
 * System property name for preconfigured connections. Only one is supported in
 * newer evitaLab versions.
 */
const preconfiguredConnectionsSystemPropertyName: string = 'pconnections'
/**
 * System property name for connection the evitaLab will connect to.
 */
const connectionSystemPropertyName: string = 'connection'

export const connectionServiceInjectionKey: InjectionKey<ConnectionService> = Symbol('connectionService')

/**
 * Service that manages lifecycle of a whole evitaLab instance. It contains generic methods for accessing evitaDB servers
 * and so on.
 */
export class ConnectionService {

    private readonly connection: Connection

    private constructor(connection: Connection) {
        this.connection = connection
    }

    /**
     * Loads data and initializes connection manager
     */
    static load(evitaLabConfig: EvitaLabConfig): ConnectionService {
        const connection: Connection = this.loadConnection(evitaLabConfig)
        return new ConnectionService(connection)
    }

    /**
     * Returns connection this lab is using to connect a server
     */
    getConnection(id?: ConnectionId): Connection {
        if (id == undefined) {
            return this.connection
        } else {
            if (this.connection.id != id) {
                throw new ConnectionNotFoundError(id)
            }
            return this.connection
        }
    }

    private static loadConnection(evitaLabConfig: EvitaLabConfig): Connection {
        const connectionSystemProperty: string | undefined =
            evitaLabConfig.systemProperty(connectionSystemPropertyName)
        if (connectionSystemProperty != undefined) {
            try {
                return Connection.fromJson(JSON.parse(connectionSystemProperty) as ConnectionJson)
            } catch (e) {
                console.error('Failed to load preconfigured connections from system properties', e)
            }
        }

        // backward compatibility: try to load old preconfigured connections
        const preconfiguredConnectionsSystemProperty: string | undefined =
            evitaLabConfig.systemProperty(preconfiguredConnectionsSystemPropertyName)
        if (preconfiguredConnectionsSystemProperty != undefined) {
            try {
                const preconfiguredConnections: Connection[] = (JSON.parse(preconfiguredConnectionsSystemProperty) as ConnectionJson[])
                    .map(connection => Connection.fromJson(connection))

                if (preconfiguredConnections.length == 0) {
                    console.warn('Preconfigured connection property present, but empty list found. Trying default connection.')
                } else if (preconfiguredConnections.length > 1) {
                    console.warn('More than one preconfigured connection found. Using first one only.')
                    return preconfiguredConnections[0]
                } else {
                    return preconfiguredConnections[0]
                }
            } catch (e) {
                console.error('Failed to load preconfigured connections from system properties', e)
            }
        }

        // automatic demo connection configuration for easier development
        if (import.meta.env.DEV) {
            const devConnection: 'DEMO' | 'LOCAL' = import.meta.env.VITE_DEV_CONNECTION
            if (devConnection === 'DEMO') {
                return new Connection(
                    'dev-demo',
                    'Demo (dev)',
                    'https://demo.evitadb.io'
                )
            } else if (devConnection === 'LOCAL') {
                return new Connection(
                    'dev-localhost',
                    'Localhost (dev)',
                    'http://localhost:5555'
                )
            }
        }

        throw new Error('No connection found')
    }

}

export const useConnectionService = (): ConnectionService => {
    return mandatoryInject(connectionServiceInjectionKey)
}
