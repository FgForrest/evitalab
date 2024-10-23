import { Connection } from "@/modules/connection/model/Connection";
import { ConnectionId } from "@/modules/connection/model/ConnectionId";
import { Transport } from "@connectrpc/connect";
import { createGrpcWebTransport } from '@connectrpc/connect-web'

/**
 * Creates and caches gRPC transport descriptors.
 */
export class TransportProvider {
    private readonly transports: Map<ConnectionId, Transport> = new Map();

    /**
     * Returns transport for the connection. Creates new one if missing
     */
    public getTransport(connection: Connection): Transport {
        let transport: Transport | undefined = this.transports.get(connection.id);
        if (transport == undefined) {
            transport = createGrpcWebTransport({
                baseUrl: connection.grpcUrl
            })
            this.transports.set(connection.id, transport);
        }
        return transport
    }
}
