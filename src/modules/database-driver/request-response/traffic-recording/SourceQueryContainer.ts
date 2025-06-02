import { Duration } from 'luxon'
import Immutable from 'immutable'
import { TrafficRecord } from '@/modules/database-driver/request-response/traffic-recording/TrafficRecord'
import { Uuid } from '@/modules/database-driver/data-type/Uuid'
import { Label } from '@/modules/database-driver/request-response/traffic-recording/Label'
import { TrafficRecordType } from '@/modules/database-driver/request-response/traffic-recording/TrafficRecordType'
import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime'

/**
 * This container holds information about the source query.
 */
export class SourceQueryContainer extends TrafficRecord {

    readonly sourceQueryId: Uuid
    readonly sourceQuery: string
    readonly labels: Immutable.List<Label>

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
                sourceQueryId: Uuid,
                sourceQuery: string,
                labels: Immutable.List<Label>) {
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
        this.sourceQueryId = sourceQueryId
        this.sourceQuery = sourceQuery
        this.labels = labels
    }
}
