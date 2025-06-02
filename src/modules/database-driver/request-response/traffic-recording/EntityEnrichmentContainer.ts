import { Duration } from 'luxon'
import { TrafficRecord } from '@/modules/database-driver/request-response/traffic-recording/TrafficRecord'
import { Uuid } from '@/modules/database-driver/data-type/Uuid'
import { TrafficRecordType } from '@/modules/database-driver/request-response/traffic-recording/TrafficRecordType'
import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime'

/**
 * This container holds information about single entity enrichment.
 */
export class EntityEnrichmentContainer extends TrafficRecord {

    /**
     * The query operation associated with enrichment.
     */
    readonly query: string
    /**
     * The primary key of the enriched record
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
