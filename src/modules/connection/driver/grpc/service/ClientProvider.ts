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

export type EvitaClient = PromiseClient<typeof EvitaService>
export type EvitaSessionClient = PromiseClient<typeof EvitaSessionService>
export type EvitaManagementClient = PromiseClient<typeof EvitaManagementService>

//TODO: Add docs
export class ClientProvider {

    private readonly transportProvider: TransportProvider = new TransportProvider()

    private readonly evitaClients: Map<ConnectionId, EvitaClient> = new Map<ConnectionId, EvitaClient>();
    private readonly evitaManagementClients: Map<ConnectionId, EvitaManagementClient> = new Map<ConnectionId, EvitaManagementClient>
    private readonly evitaSessionClients: Map<ConnectionId, EvitaSessionClient> = new Map<ConnectionId, EvitaSessionClient>

    public getEvitaClient(connection: Connection): EvitaClient {
        let evitaClient : EvitaClient | undefined = this.evitaClients.get(connection.id);
        if (!evitaClient) {
            evitaClient = createPromiseClient(EvitaService, this.transportProvider.getTransport(connection))
            this.evitaClients.set(connection.id, evitaClient);
            return evitaClient;
        }
        return evitaClient;
    }


    public getEvitaManagementClient(connection: Connection): EvitaManagementClient {
        let managementClient : EvitaManagementClient | undefined = this.evitaManagementClients?.get(connection.id);
        if (managementClient == undefined) {
            managementClient = createPromiseClient(EvitaManagementService, this.transportProvider.getTransport(connection))
        }
        return managementClient
    }


    public getEvitaSessionClient(connection: Connection): EvitaSessionClient {
        let sessionClient : EvitaSessionClient | undefined = this.evitaSessionClients?.get(connection.id);
        if (sessionClient == undefined) {
            sessionClient = createPromiseClient(EvitaSessionService, this.transportProvider.getTransport(connection))
        }
        return sessionClient
    }
}
