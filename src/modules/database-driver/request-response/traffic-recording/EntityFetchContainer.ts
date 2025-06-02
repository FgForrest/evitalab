import { Uuid } from '@/modules/database-driver/data-type/Uuid'
import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime'
import { Duration } from 'luxon'
import { TrafficRecord } from '@/modules/database-driver/request-response/traffic-recording/TrafficRecord'
import { TrafficRecordType } from '@/modules/database-driver/request-response/traffic-recording/TrafficRecordType'

/**
 * This container holds information about single entity fetch.
 */
export class EntityFetchContainer extends TrafficRecord {

    /**
     * The query operation associated with entity fetch.
     */
    readonly query: string
    /**
     * The primary key of the fetched record
     */
    readonly primaryKey: number

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
                query: string,
                primaryKey: number) {
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
        this.query = query
        this.primaryKey = primaryKey
    }
}
