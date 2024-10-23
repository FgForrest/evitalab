import { OffsetDateTime } from "../data-type/OffsetDateTime"
import Immutable from 'immutable'
import { ApiStatus } from '@/modules/connection/model/status/ApiStatus'
import { HealthProblem } from '@/modules/connection/model/status/HealthProblem'
import { Readiness } from '@/modules/connection/model/status/Readiness'
import { ApiType } from '@/modules/connection/model/status/ApiType'

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
    readonly healthProblems: Immutable.Set<HealthProblem>
    readonly readiness: Readiness
    readonly apis: Immutable.Map<ApiType, ApiStatus>

    constructor(version: string,
                started: OffsetDateTime,
                uptime: bigint,
                instanceId: string,
                catalogsCorrupted: number,
                catalogsOk: number,
                readOnly: boolean,
                healthProblems: Immutable.Set<HealthProblem>,
                readiness: Readiness,
                apis: Immutable.Map<ApiType, ApiStatus>) {
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
