import type { CallOptions, Client, Transport } from '@connectrpc/connect'
import { createClient } from '@connectrpc/connect'
import { EvitaValueConverter } from '@/modules/database-driver/connector/grpc/service/converter/EvitaValueConverter'
import {
    CatalogSchemaConverter
} from '@/modules/database-driver/connector/grpc/service/converter/CatalogSchemaConverter'
import { Connection } from '@/modules/connection/model/Connection'
import { createGrpcWebTransport } from '@connectrpc/connect-web'
import {
    CatalogStatisticsConverter
} from '@/modules/database-driver/connector/grpc/service/converter/CatalogStatisticsConverter'
import { EntityConverter } from '@/modules/database-driver/connector/grpc/service/converter/EntityConverter'
import { ExtraResultConverter } from '@/modules/database-driver/connector/grpc/service/converter/ExtraResultConverter'
import {
    EvitaResponseConverter
} from '@/modules/database-driver/connector/grpc/service/converter/EvitaResponseConverter'
import { ErrorTransformer } from '@/modules/database-driver/exception/ErrorTransformer'
import { ServerStatusConverter } from '@/modules/database-driver/connector/grpc/service/converter/ServerStatusConverter'
import {
    EngineSettingsConverter
} from '@/modules/database-driver/connector/grpc/service/converter/EngineSettingsConverter'
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
import type { KyInstance } from 'ky'
import {
    MutationProgressConverter
} from '@/modules/database-driver/connector/grpc/service/converter/MutationProgressConverter.ts'
import { ScopesConverter } from '@/modules/database-driver/connector/grpc/service/converter/ScopesConverter.ts'
import {
    MutationHistoryConverter
} from '@/modules/database-driver/connector/grpc/service/converter/MutationHistoryConverter.ts'
import {
    ChangeSystemCaptureConverter
} from '@/modules/database-driver/connector/grpc/service/converter/ChangeSystemCaptureConverter.ts'
import {
    RegisterSystemChangeCaptureResponseConverter
} from '@/modules/database-driver/connector/grpc/service/converter/RegisterSystemChangeCaptureResponseConverter.ts'
import {
    clientVersionHeader,
    resolveClientVersion
} from '@/modules/database-driver/connector/grpc/utils/ClientVersion.ts'
import { isConnectivityError } from '@/modules/database-driver/exception/connectivityError'
import {
    markServerReachable,
    markServerUnreachable
} from '@/modules/database-driver/model/serverConnectivity'


export type EvitaServiceClient = Client<typeof EvitaService>
export type EvitaSessionServiceClient = Client<typeof EvitaSessionService>
export type EvitaManagementServiceClient = Client<typeof EvitaManagementService>
export type EvitaTrafficRecordingServiceClient = Client<typeof GrpcEvitaTrafficRecordingService>

/**
 * Deadline applied to every server call that has not asked for a different one - the counterpart of the
 * official evitaDB Java driver's `ClientTimeoutOptions.timeout`. Shared by both transports: gRPC receives
 * it as `defaultTimeoutMs` of the transport, HTTP as ky's client-wide `timeout`, so nothing the driver
 * exposes can hang forever without a caller having opted into it.
 *
 * Intentionally short, because everything that inherits it is metadata - schemas, statistics, session
 * creation, listings, introspection. Calls that are legitimately allowed to run longer opt up to
 * {@link userQueryTimeout} at their call site, and streams opt out entirely with `{ timeoutMs: 0 }`.
 */
export const defaultCallTimeout: number = 15_000

/**
 * Deadline for calls that carry a **user-issued query**, which may legitimately run for minutes on a large
 * catalog. Kept at the value the HTTP client used for everything before deadlines were classified, so no
 * query that worked before can start failing now.
 */
export const userQueryTimeout: number = 300_000

/**
 * Call options every **streaming** gRPC call must pass. `timeoutMs: 0` disables the transport-wide
 * {@link defaultCallTimeout}, which is a *whole-call* deadline and would therefore kill a perfectly healthy
 * long-lived stream the moment it expires.
 *
 * Note this only removes the deadline - it does not replace it with anything. The evitaDB Java driver instead
 * re-arms a **per-message** deadline (`ClientTimeoutOptions.streamingTimeout`, 300 s, reset after every
 * received message), a semantic connect-web's whole-call `timeoutMs` cannot express. evitaLab's only
 * equivalent is `DataCacheRefresher`'s heartbeat watchdog on the system-CDC stream; the other streams have
 * none, which is a pre-existing gap rather than something these options introduce.
 *
 * Nothing enforces this mechanically: a new streaming call that forgets to pass these options compiles,
 * type-checks and passes tests, and only breaks at runtime once its transfer outlives the default deadline.
 */
export const unboundedStreamOptions: CallOptions = { timeoutMs: 0 }

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
    private _scopeConverter?: ScopesConverter
    private _catalogStatisticsConverter?: CatalogStatisticsConverter
    private _catalogSchemaConverter?: CatalogSchemaConverter
    private _entityConverter?: EntityConverter
    private _extraResultConverter?: ExtraResultConverter
    private _responseConverter?: EvitaResponseConverter
    private _mutationProgressConverter?: MutationProgressConverter

    private _serverStatusConverter?: ServerStatusConverter
    private _engineSettingsConverter?: EngineSettingsConverter
    private _reservedKeywordsConverter?: ReservedKeywordsConverter
    private _serverFileConverter?: ServerFileConverter
    private _taskStateConverter?: TaskStateConverter
    private _taskStatusConverter?: TaskStatusConverter
    private _trafficRecordingConverter?: TrafficRecordingConverter
    private _mutationHistoryConverter?: MutationHistoryConverter
    private _changeSystemCaptureConverter?: ChangeSystemCaptureConverter
    private _registerSystemChangeCaptureResponseConverter?: RegisterSystemChangeCaptureResponseConverter

    protected constructor(evitaLabConfig: EvitaLabConfig,
                          connectionService: ConnectionService) {
        this.evitaLabConfig = evitaLabConfig
        this.connection = connectionService.getConnection()
        this.httpApiClient = ky.create({
            timeout: defaultCallTimeout,
            hooks: {
                // the HTTP counterpart of the gRPC interceptor below: a user working only in a GraphQL console
                // produces no gRPC traffic at all, and without this a single transient fetch failure would
                // latch evitaLab "offline" until some unrelated gRPC call happened to succeed. Any response
                // proves the server answered - error statuses included, and ky runs this before it throws
                // `HTTPError` for them.
                afterResponse: [() => { markServerReachable() }]
            }
        })
        this.errorTransformer = new ErrorTransformer(this.connection)
    }

    private get transport(): Transport {
        if (this._transport == undefined) {
            const clientVersion: string | undefined = resolveClientVersion(__EVITADB_API_VERSION__)
            this._transport = createGrpcWebTransport({
                baseUrl: this.connection.grpcUrl,
                // applies to every unary *and* streaming call made through this transport, which is why every
                // long-lived stream has to opt out of it explicitly with `{ timeoutMs: 0 }`
                defaultTimeoutMs: defaultCallTimeout,
                interceptors: [
                    // declares the supported evitaDB API version to the server, so that it can pick response forms
                    // this client understands
                    next => async req => {
                        if (clientVersion != undefined) {
                            req.header.set(clientVersionHeader, clientVersion)
                        }
                        // this interceptor covers every gRPC call of all four service clients, unary and
                        // streaming alike, which makes it one of the two places that observe the server
                        // *answering* (the other is the `afterResponse` hook of `httpApiClient` above) - and
                        // therefore a reliable signal that evitaLab is back online. Failures are marked here
                        // too, so reachability does not depend on a caller reaching ErrorTransformer.
                        try {
                            const response = await next(req)
                            markServerReachable()
                            return response
                        } catch (e) {
                            if (isConnectivityError(e)) {
                                markServerUnreachable()
                            }
                            throw e
                        }
                    }
                ]
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

    protected get scopeConverter(): ScopesConverter {
        if (this._scopeConverter == undefined) {
            this._scopeConverter = new ScopesConverter()
        }
        return this._scopeConverter
    }

    protected get catalogStatisticsConverter(): CatalogStatisticsConverter {
        if (this._catalogStatisticsConverter == undefined) {
            this._catalogStatisticsConverter = new CatalogStatisticsConverter()
        }
        return this._catalogStatisticsConverter
    }

    protected get catalogSchemaConverter(): CatalogSchemaConverter {
        if (this._catalogSchemaConverter == undefined) {
            this._catalogSchemaConverter = new CatalogSchemaConverter()
        }
        return this._catalogSchemaConverter
    }

    protected get entityConverter(): EntityConverter {
        if (this._entityConverter == undefined) {
            this._entityConverter = new EntityConverter()
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
            this._serverStatusConverter = new ServerStatusConverter()
        }
        return this._serverStatusConverter
    }

    protected get engineSettingsConverter(): EngineSettingsConverter {
        if (this._engineSettingsConverter == undefined) {
            this._engineSettingsConverter = new EngineSettingsConverter()
        }
        return this._engineSettingsConverter
    }

    protected get reservedKeywordsConverter(): ReservedKeywordsConverter {
        if (this._reservedKeywordsConverter == undefined) {
            this._reservedKeywordsConverter = new ReservedKeywordsConverter()
        }
        return this._reservedKeywordsConverter
    }

    protected get serverFileConverter(): ServerFileConverter {
        if (this._serverFileConverter == undefined) {
            this._serverFileConverter = new ServerFileConverter()
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
            this._taskStatusConverter = new TaskStatusConverter(this.taskStateConverter, this.serverFileConverter)
        }
        return this._taskStatusConverter
    }

    protected get trafficRecordingConverter(): TrafficRecordingConverter {
        if (this._trafficRecordingConverter == undefined) {
            this._trafficRecordingConverter = new TrafficRecordingConverter()
        }
        return this._trafficRecordingConverter
    }

    protected get mutationHistoryConverter(): MutationHistoryConverter {
        if (this._mutationHistoryConverter == undefined) {
            this._mutationHistoryConverter = new MutationHistoryConverter()
        }
        return this._mutationHistoryConverter
    }

    protected get mutationProgressConverter(): MutationProgressConverter {
        if (this._mutationProgressConverter == undefined) {
            this._mutationProgressConverter = new MutationProgressConverter()
        }

        return this._mutationProgressConverter
    }

    protected get changeSystemCaptureConverter(): ChangeSystemCaptureConverter {
        if (this._changeSystemCaptureConverter == undefined) {
            this._changeSystemCaptureConverter = new ChangeSystemCaptureConverter()
        }
        return this._changeSystemCaptureConverter
    }

    protected get registerSystemChangeCaptureResponseConverter(): RegisterSystemChangeCaptureResponseConverter {
        if (this._registerSystemChangeCaptureResponseConverter == undefined) {
            this._registerSystemChangeCaptureResponseConverter =
                new RegisterSystemChangeCaptureResponseConverter(this.changeSystemCaptureConverter)
        }
        return this._registerSystemChangeCaptureResponseConverter
    }
}
