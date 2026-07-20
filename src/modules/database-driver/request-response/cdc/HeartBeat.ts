import type { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime.ts'

/**
 * Internal counterpart of the gRPC `GrpcHeartBeat`. Sent periodically (and with the acknowledgement)
 * to keep the change-capture stream alive and to communicate liveness information.
 */
export class HeartBeat {
    /** The index of the heartbeat event. */
    readonly index: number
    /** The timestamp of the heartbeat event on the server. */
    readonly timestamp: OffsetDateTime | undefined
    /** The last engine version observed by the server for this subscriber. */
    readonly lastObservedVersion: number
    /** Milliseconds to the next heartbeat (derived from the server configuration). */
    readonly millisToNextHeartbeat: number

    constructor(
        index: number,
        timestamp: OffsetDateTime | undefined,
        lastObservedVersion: number,
        millisToNextHeartbeat: number
    ) {
        this.index = index
        this.timestamp = timestamp
        this.lastObservedVersion = lastObservedVersion
        this.millisToNextHeartbeat = millisToNextHeartbeat
    }
}
