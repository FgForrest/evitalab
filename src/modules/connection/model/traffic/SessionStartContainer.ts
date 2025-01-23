import { Uuid } from '@/modules/connection/model/data-type/Uuid'
import { OffsetDateTime } from '@/modules/connection/model/data-type/OffsetDateTime'
import { Duration } from 'luxon'
import { TrafficRecord } from '@/modules/connection/model/traffic/TrafficRecord'
import { TrafficRecordType } from '@/modules/connection/model/traffic/TrafficRecordType'

/**
 * This container holds information about the session start.
 */
export class SessionStartContainer extends TrafficRecord {

    readonly catalogVersion: bigint

    constructor(sessionSequenceOrder: bigint | undefined,
                sessionId: Uuid,
                recordSessionOffset: number,
                type: TrafficRecordType,
                created: OffsetDateTime,
                duration: Duration,
                ioFetchedSizeBytes: number,
                ioFetchCount: number,
                catalogVersion: bigint) {
        super(
            sessionSequenceOrder,
            sessionId,
            recordSessionOffset,
            type,
            created,
            duration,
            ioFetchedSizeBytes,
            ioFetchCount
        )
        this.catalogVersion = catalogVersion
    }
}
