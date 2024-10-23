import Immutable from 'immutable'
import { Endpoint } from '@/modules/connection/model/status/Endpoint'

/**
 * Represents status of a single API of server
 */
export class ApiStatus {
    readonly enabled: boolean
    readonly ready: boolean
    readonly baseUrls: Immutable.List<string>
    readonly endpoints: Immutable.List<Endpoint>

    constructor(enabled: boolean,
                ready: boolean,
                baseUrls: Immutable.List<string>,
                endpoints: Immutable.List<Endpoint>) {
        this.enabled = enabled
        this.ready = ready
        this.baseUrls = baseUrls
        this.endpoints = endpoints
    }
}
