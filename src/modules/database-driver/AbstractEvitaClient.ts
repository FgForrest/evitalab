import { createClient } from '@connectrpc/connect'
import type { Client, Transport } from '@connectrpc/connect'
import { EvitaValueConverter } from '@/modules/database-driver/connector/grpc/service/converter/EvitaValueConverter'
import {
    CatalogSchemaConverter
} from '@/modules/database-driver/connector/grpc/service/converter/CatalogSchemaConverter'
import { Connection } from '@/modules/connection/model/Connection'
import { createGrpcWebTransport } from '@connectrpc/connect-web'
import { CatalogStatisticsConverter } from '@/modules/database-driver/connector/grpc/service/converter/CatalogStatisticsConverter'
import { EntityConverter } from '@/modules/database-driver/connector/grpc/service/converter/EntityConverter'
import { ExtraResultConverter } from '@/modules/database-driver/connector/grpc/service/converter/ExtraResultConverter'
import { EvitaResponseConverter } from '@/modules/database-driver/connector/grpc/service/converter/EvitaResponseConverter'
import { ErrorTransformer } from '@/modules/database-driver/exception/ErrorTransformer'
import { ServerStatusConverter } from '@/modules/database-driver/connector/grpc/service/converter/ServerStatusConverter'
import {
    ReservedKeywordsConverter
} from '@/modules/database-driver/connector/grpc/service/converter/ReservedKeywordsConverter'
import { TaskStatusConverter } from '@/modules/database-driver/connector/grpc/service/converter/TaskStatusConverter'
import { TaskStateConverter } from '@/modules/database-driver/connector/grpc/service/converter/TaskStateConverter'
import { ServerFileConverter } from '@/modules/database-driver/connector/grpc/service/converter/ServerFileConverter'
import {
    TrafficRecordingConverter
} from '@/modules/database-driver/connector/grpc/service/converter/TrafficRecordingConverter'
import { EvitaLabConfig } from '@/modules/config/EvitaLabConfig'
import { ConnectionService } from '@/modules/connection/service/ConnectionService'
import ky from 'ky'
import { EvitaService } from './connector/grpc/gen/GrpcEvitaAPI_pb'
import { EvitaSessionService } from './connector/grpc/gen/GrpcEvitaSessionAPI_pb'
import { EvitaManagementService } from './connector/grpc/gen/GrpcEvitaManagementAPI_pb'
import { GrpcEvitaTrafficRecordingService } from './connector/grpc/gen/GrpcEvitaTrafficRecordingAPI_pb'
import type { KyInstance } from 'ky/distribution/types/ky'

export type EvitaServiceClient = Client<typeof EvitaService>
export type EvitaSessionServiceClient = Client<typeof EvitaSessionService>
export type EvitaManagementServiceClient = Client<typeof EvitaManagementService>
export type EvitaTrafficRecordingServiceClient = Client<typeof GrpcEvitaTrafficRecordingService>

/**
 * Ancestor for {@link EvitaServiceClient}. Contains all sorts of initializations that
 * would clutter the main EvitaClient.
 */
export abstract class AbstractEvitaClient {

    protected readonly evitaLabConfig: EvitaLabConfig
    readonly connection: Connection

    protected readonly httpApiClient: KyInstance

    protected readonly errorTransformer: ErrorTransformer

    private _transport?: Transport = undefined
    private _evitaClient?: EvitaServiceClient = undefined
    private _evitaManagementClient?: EvitaManagementServiceClient = undefined
    private _evitaSessionClient?: EvitaSessionServiceClient = undefined
    private _evitaTrafficRecordingClient?: EvitaTrafficRecordingServiceClient = undefined

    private _evitaValueConverter?: EvitaValueConverter
    private _catalogStatisticsConverter?: CatalogStatisticsConverter
    private _catalogSchemaConverter?: CatalogSchemaConverter
    private _entityConverter?: EntityConverter
    private _extraResultConverter?: ExtraResultConverter
    private _responseConverter?: EvitaResponseConverter

    private _serverStatusConverter?: ServerStatusConverter
    private _reservedKeywordsConverter?: ReservedKeywordsConverter
    private _serverFileConverter?: ServerFileConverter
    private _taskStateConverter?: TaskStateConverter
    private _taskStatusConverter?: TaskStatusConverter
    private _trafficRecordingConverter?: TrafficRecordingConverter

    protected constructor(evitaLabConfig: EvitaLabConfig,
                          connectionService: ConnectionService) {
        this.evitaLabConfig = evitaLabConfig
        this.connection = connectionService.getConnection()
        this.httpApiClient = ky.create({
            timeout: 300000 // 5 minutes
        })
        this.errorTransformer = new ErrorTransformer(this.connection)
    }

    private get transport(): Transport {
        if (this._transport == undefined) {
            this._transport = createGrpcWebTransport({
                baseUrl: this.connection.grpcUrl
            })
        }
        return this._transport
    }

    /**
     * Returns client for Evita API of gRPC. Creates new one if missing.
     */
    protected get evitaClient(): EvitaServiceClient {
        if (this._evitaClient == undefined) {
            this._evitaClient = createClient(EvitaService, this.transport)
        }
        return this._evitaClient
    }

    /**
     * Returns client for management API of gRPC. Creates new one if missing.
     */
    protected get evitaManagementClient(): EvitaManagementServiceClient {
        if (this._evitaManagementClient == undefined) {
            this._evitaManagementClient = createClient(EvitaManagementService, this.transport)
        }
        return this._evitaManagementClient
    }

    /**
     * Returns client for session API of gRPC. Creates new one if missing.
     */
    protected get evitaSessionClient(): EvitaSessionServiceClient {
        if (this._evitaSessionClient == undefined) {
            this._evitaSessionClient = createClient(EvitaSessionService, this.transport)
        }
        return this._evitaSessionClient
    }

    /**
     * Returns client for traffic recording API of gRPC. Creates new one if missing.
     */
    protected get evitaTrafficRecordingClient(): EvitaTrafficRecordingServiceClient {
        if (this._evitaTrafficRecordingClient == undefined) {
            this._evitaTrafficRecordingClient = createClient(GrpcEvitaTrafficRecordingService, this.transport)
        }
        return this._evitaTrafficRecordingClient
    }

    protected get evitaValueConverter(): EvitaValueConverter {
        if (this._evitaValueConverter == undefined) {
            this._evitaValueConverter = new EvitaValueConverter()
        }
        return this._evitaValueConverter
    }

    protected get catalogStatisticsConverter(): CatalogStatisticsConverter {
        if (this._catalogStatisticsConverter == undefined) {
            this._catalogStatisticsConverter = new CatalogStatisticsConverter(this.evitaValueConverter)
        }
        return this._catalogStatisticsConverter
    }

    protected get catalogSchemaConverter(): CatalogSchemaConverter {
        if (this._catalogSchemaConverter == undefined) {
            this._catalogSchemaConverter = new CatalogSchemaConverter(this.evitaValueConverter)
        }
        return this._catalogSchemaConverter
    }

    protected get entityConverter(): EntityConverter {
        if (this._entityConverter == undefined) {
            this._entityConverter = new EntityConverter(this.evitaValueConverter)
        }
        return this._entityConverter
    }

    protected get extraResultConverter(): ExtraResultConverter {
        if (this._extraResultConverter == undefined) {
            this._extraResultConverter = new ExtraResultConverter(this.entityConverter)
        }
        return this._extraResultConverter
    }

    protected get responseConverter(): EvitaResponseConverter {
        if (this._responseConverter == undefined) {
            this._responseConverter = new EvitaResponseConverter(this.entityConverter, this.extraResultConverter)
        }
        return this._responseConverter
    }

    protected get serverStatusConverter(): ServerStatusConverter {
        if (this._serverStatusConverter == undefined) {
            this._serverStatusConverter = new ServerStatusConverter(this.evitaValueConverter)
        }
        return this._serverStatusConverter
    }

    protected get reservedKeywordsConverter(): ReservedKeywordsConverter {
        if (this._reservedKeywordsConverter == undefined) {
            this._reservedKeywordsConverter = new ReservedKeywordsConverter()
        }
        return this._reservedKeywordsConverter
    }

    protected get serverFileConverter(): ServerFileConverter {
        if (this._serverFileConverter == undefined) {
            this._serverFileConverter = new ServerFileConverter(this.evitaValueConverter)
        }
        return this._serverFileConverter
    }

    protected get taskStateConverter(): TaskStateConverter {
        if (this._taskStateConverter == undefined) {
            this._taskStateConverter = new TaskStateConverter()
        }
        return this._taskStateConverter
    }

    protected get taskStatusConverter(): TaskStatusConverter {
        if (this._taskStatusConverter == undefined) {
            this._taskStatusConverter = new TaskStatusConverter(this.evitaValueConverter, this.taskStateConverter, this.serverFileConverter)
        }
        return this._taskStatusConverter
    }

    protected get trafficRecordingConverter(): TrafficRecordingConverter {
        if (this._trafficRecordingConverter == undefined) {
            this._trafficRecordingConverter = new TrafficRecordingConverter(
                this.evitaValueConverter
            )
        }
        return this._trafficRecordingConverter
    }

}
