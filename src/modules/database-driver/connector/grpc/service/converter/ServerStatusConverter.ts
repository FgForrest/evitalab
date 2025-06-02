import { GrpcHealthProblem, GrpcReadiness } from '@/modules/database-driver/connector/grpc/gen/GrpcEnums_pb'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import Immutable from 'immutable'
import { EvitaValueConverter } from '@/modules/database-driver/connector/grpc/service/converter/EvitaValueConverter'
import {
    GrpcApiStatus, GrpcEndpoint,
    GrpcEvitaServerStatusResponse
} from '@/modules/database-driver/connector/grpc/gen/GrpcEvitaManagementAPI_pb'
import { ServerStatus } from '@/modules/database-driver/request-response/status/ServerStatus'
import { HealthProblem } from '@/modules/database-driver/request-response/status/HealthProblem'
import { Readiness } from '@/modules/database-driver/request-response/status/Readiness'
import { ApiType } from '@/modules/database-driver/request-response/status/ApiType'
import { ApiStatus } from '@/modules/database-driver/request-response/status/ApiStatus'
import { Endpoint } from '@/modules/database-driver/request-response/status/Endpoint'

/**
 * Convert server status from gRPC to evitaLab representation.
 */
export class ServerStatusConverter {

    readonly evitaValueConverter: EvitaValueConverter

    constructor(evitaValueConverter: EvitaValueConverter) {
        this.evitaValueConverter = evitaValueConverter
    }

    convert(serverStatus: GrpcEvitaServerStatusResponse):ServerStatus{
        return new ServerStatus(
            serverStatus.version,
            this.evitaValueConverter.convertGrpcOffsetDateTime(serverStatus.startedAt!),
            serverStatus.uptime,
            serverStatus.instanceId,
            serverStatus.catalogsCorrupted,
            serverStatus.catalogsOk,
            serverStatus.readOnly,
            this.convertHealthProblems(serverStatus.healthProblems),
            this.convertReadiness(serverStatus.readiness),
            this.convertApis(serverStatus.api)
        )
    }

    private convertHealthProblems(grpcHealthProblems: GrpcHealthProblem[]): Immutable.Set<HealthProblem> {
        const healthProblems: HealthProblem[] = []
        for (const grpcHealthProblem of grpcHealthProblems) {
            healthProblems.push(this.convertHealthProblem(grpcHealthProblem))
        }
        return Immutable.Set<HealthProblem>(healthProblems)
    }

    private convertHealthProblem(grpcHealthProblem: GrpcHealthProblem): HealthProblem {
        switch (grpcHealthProblem) {
            case GrpcHealthProblem.MEMORY_SHORTAGE: return HealthProblem.MemoryShortage
            case GrpcHealthProblem.EXTERNAL_API_UNAVAILABLE: return HealthProblem.ExternalApiUnavailable
            case GrpcHealthProblem.INPUT_QUEUES_OVERLOADED: return HealthProblem.InputQueuesOverloaded
            case GrpcHealthProblem.JAVA_INTERNAL_ERRORS: return HealthProblem.JavaInternalErrors
            default:
                throw new UnexpectedError(`Unsupported health problem type '${grpcHealthProblem}'.`)
        }
    }

    private convertReadiness(grpcReadiness: GrpcReadiness): Readiness {
        switch (grpcReadiness) {
            case GrpcReadiness.API_UNKNOWN: return Readiness.Unknown
            case GrpcReadiness.API_STARTING: return Readiness.Starting
            case GrpcReadiness.API_READY: return Readiness.Ready
            case GrpcReadiness.API_STALLING: return Readiness.Stalling
            case GrpcReadiness.API_SHUTDOWN: return Readiness.Shutdown
            default:
                throw new UnexpectedError(`Unsupported readiness type '${grpcReadiness}'.`)
        }
    }

    private convertApis(grpcApis: { [key: string]: GrpcApiStatus }): Immutable.Map<ApiType, ApiStatus> {
        const apis: Map<ApiType, ApiStatus> = new Map<ApiType, ApiStatus>()
        for (const grpcApiType in grpcApis) {
            apis.set(
                this.convertApiType(grpcApiType),
                this.convertApiStatus(grpcApis[grpcApiType])
            )
        }
        return Immutable.Map(apis)
    }

    private convertApiType(grpcApiType: string): ApiType {
        switch (grpcApiType) {
            case 'graphQL': return ApiType.GraphQL
            case 'rest': return ApiType.Rest
            case 'gRPC': return ApiType.Grpc
            case 'system': return ApiType.System
            case 'lab': return ApiType.Lab
            case 'observability': return ApiType.Observability
            default:
                throw new UnexpectedError(`Unsupported api type '${grpcApiType}'.`)
        }
    }

    private convertApiStatus(grpcApiStatus: GrpcApiStatus): ApiStatus {
        return new ApiStatus(
            grpcApiStatus.enabled,
            grpcApiStatus.ready,
            Immutable.List(grpcApiStatus.baseUrl),
            this.convertEndpoints(grpcApiStatus.endpoints)
        )
    }

    private convertEndpoints(grpcEndpoints: GrpcEndpoint[]): Immutable.List<Endpoint> {
        const endpoints: Endpoint[] = []
        for (const grpcEndpoint of grpcEndpoints) {
            endpoints.push(this.convertEndpoint(grpcEndpoint))
        }
        return Immutable.List(endpoints)
    }

    private convertEndpoint(grpcEndpoint: GrpcEndpoint): Endpoint {
        return new Endpoint(
            grpcEndpoint.name,
            Immutable.List(grpcEndpoint.url)
        )
    }
}
