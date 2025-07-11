import { List as ImmutableList } from 'immutable'
import { Endpoint } from '@/modules/database-driver/request-response/status/Endpoint'

/**
 * Represents status of a single API of server
 */
export class ApiStatus {
    readonly enabled: boolean
    readonly ready: boolean
    readonly baseUrls: ImmutableList<string>
    readonly endpoints: ImmutableList<Endpoint>

    constructor(enabled: boolean,
                ready: boolean,
                baseUrls: ImmutableList<string>,
                endpoints: ImmutableList<Endpoint>) {
        this.enabled = enabled
        this.ready = ready
        this.baseUrls = baseUrls
        this.endpoints = endpoints
    }
}
