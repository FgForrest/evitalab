import { Set as ImmutableSet, Map as ImmutableMap } from 'immutable'
import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime'
import { Readiness } from '@/modules/database-driver/request-response/status/Readiness'
import { HealthProblem } from '@/modules/database-driver/request-response/status/HealthProblem'
import { ApiType } from '@/modules/database-driver/request-response/status/ApiType'
import { ApiStatus } from '@/modules/database-driver/request-response/status/ApiStatus'

/**
 * Represents status and info of a server
 */
export class ServerStatus {

    readonly version: string
    readonly started: OffsetDateTime
    readonly uptime: bigint
    readonly instanceId: string
    readonly catalogsCorrupted: number
    readonly catalogsOk: number
    readonly readOnly: boolean
    readonly healthProblems: ImmutableSet<HealthProblem>
    readonly readiness: Readiness
    readonly apis: ImmutableMap<ApiType, ApiStatus>

    constructor(version: string,
                started: OffsetDateTime,
                uptime: bigint,
                instanceId: string,
                catalogsCorrupted: number,
                catalogsOk: number,
                readOnly: boolean,
                healthProblems: ImmutableSet<HealthProblem>,
                readiness: Readiness,
                apis: ImmutableMap<ApiType, ApiStatus>) {
        this.version = version
        this.started = started
        this.uptime = uptime
        this.instanceId = instanceId
        this.catalogsCorrupted = catalogsCorrupted
        this.catalogsOk = catalogsOk
        this.readOnly = readOnly
        this.healthProblems = healthProblems
        this.readiness = readiness
        this.apis = apis
    }

    /**
     * Returns true if the requested API is configured and enabled on the server
     */
    apiEnabled(apiType: ApiType): boolean {
        const apiStatus: ApiStatus | undefined = this.apis.get(apiType)
        return apiStatus != undefined && apiStatus.enabled
    }
}
