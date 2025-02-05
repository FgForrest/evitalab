import {
    createPromiseClient,
    PromiseClient,
} from '@connectrpc/connect'
import { EvitaService } from '../gen/GrpcEvitaAPI_connect'
import { EvitaManagementService } from '../gen/GrpcEvitaManagementAPI_connect'
import { EvitaSessionService } from '../gen/GrpcEvitaSessionAPI_connect'
import { Connection } from '@/modules/connection/model/Connection'
import { ConnectionId } from '@/modules/connection/model/ConnectionId'
import { TransportProvider } from '@/modules/connection/driver/grpc/service/TransportProvider'
import {
    GrpcEvitaTrafficRecordingService
} from '@/modules/connection/driver/grpc/gen/GrpcEvitaTrafficRecordingAPI_connect'

export type EvitaClient = PromiseClient<typeof EvitaService>
export type EvitaSessionClient = PromiseClient<typeof EvitaSessionService>
export type EvitaManagementClient = PromiseClient<typeof EvitaManagementService>
export type EvitaTrafficRecordingClient = PromiseClient<typeof GrpcEvitaTrafficRecordingService>

/**
 * Creates and caches gRPC clients for connections
 */
export class ClientProvider {

    private readonly transportProvider: TransportProvider = new TransportProvider()

    private readonly evitaClients: Map<ConnectionId, EvitaClient> = new Map<ConnectionId, EvitaClient>();
    private readonly evitaManagementClients: Map<ConnectionId, EvitaManagementClient> = new Map<ConnectionId, EvitaManagementClient>
    private readonly evitaSessionClients: Map<ConnectionId, EvitaSessionClient> = new Map<ConnectionId, EvitaSessionClient>
    private readonly evitaTrafficRecordingClients: Map<ConnectionId, EvitaTrafficRecordingClient> = new Map<ConnectionId, EvitaTrafficRecordingClient>

    /**
     * Returns client for Evita API of gRPC. Creates new one if missing.
     */
    public getEvitaClient(connection: Connection): EvitaClient {
        let evitaClient : EvitaClient | undefined = this.evitaClients.get(connection.id);
        if (!evitaClient) {
            evitaClient = createPromiseClient(EvitaService, this.transportProvider.getTransport(connection))
            this.evitaClients.set(connection.id, evitaClient);
            return evitaClient;
        }
        return evitaClient;
    }

    /**
     * Returns client for management API of gRPC. Creates new one if missing.
     */
    public getEvitaManagementClient(connection: Connection): EvitaManagementClient {
        let managementClient : EvitaManagementClient | undefined = this.evitaManagementClients?.get(connection.id);
        if (managementClient == undefined) {
            managementClient = createPromiseClient(EvitaManagementService, this.transportProvider.getTransport(connection))
        }
        return managementClient
    }

    /**
     * Returns client for session API of gRPC. Creates new one if missing.
     */
    public getEvitaSessionClient(connection: Connection): EvitaSessionClient {
        let sessionClient : EvitaSessionClient | undefined = this.evitaSessionClients?.get(connection.id);
        if (sessionClient == undefined) {
            sessionClient = createPromiseClient(EvitaSessionService, this.transportProvider.getTransport(connection))
        }
        return sessionClient
    }

    /**
     * Returns client for traffic recording API of gRPC. Creates new one if missing.
     */
    public getEvitaTrafficRecordingClient(connection: Connection): EvitaTrafficRecordingClient {
        let trafficRecordingClient: EvitaTrafficRecordingClient | undefined = this.evitaTrafficRecordingClients?.get(connection.id)
        if (trafficRecordingClient == undefined) {
            trafficRecordingClient = createPromiseClient(GrpcEvitaTrafficRecordingService, this.transportProvider.getTransport(connection))
        }
        return trafficRecordingClient
    }
}
