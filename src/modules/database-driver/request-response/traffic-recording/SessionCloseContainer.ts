import { Duration } from 'luxon'
import { TrafficRecord } from '@/modules/database-driver/request-response/traffic-recording/TrafficRecord'
import { Uuid } from '@/modules/database-driver/data-type/Uuid'
import { TrafficRecordType } from '@/modules/database-driver/request-response/traffic-recording/TrafficRecordType'
import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime'

/**
 * This container holds information about the session close.
 */
export class SessionCloseContainer extends TrafficRecord {

    readonly catalogVersion: bigint
    readonly trafficRecordCount: number
    readonly queryCount: number
    readonly entityFetchCount: number
    readonly mutationCount: number

    constructor(sessionSequenceOrder: bigint,
                sessionId: Uuid,
                recordSessionOffset: number,
                sessionRecordsCount: number,
                type: TrafficRecordType,
                created: OffsetDateTime,
                duration: Duration,
                ioFetchedSizeBytes: number,
                ioFetchCount: number,
                finishedWithError: string | undefined,
                catalogVersion: bigint,
                trafficRecordCount: number,
                queryCount: number,
                entityFetchCount: number,
                mutationCount: number) {
        super(
            sessionSequenceOrder,
            sessionId,
            recordSessionOffset,
            sessionRecordsCount,
            type,
            created,
            duration,
            ioFetchedSizeBytes,
            ioFetchCount,
            finishedWithError
        )
        this.catalogVersion = catalogVersion
        this.trafficRecordCount = trafficRecordCount
        this.queryCount = queryCount
        this.entityFetchCount = entityFetchCount
        this.mutationCount = mutationCount
    }
}
