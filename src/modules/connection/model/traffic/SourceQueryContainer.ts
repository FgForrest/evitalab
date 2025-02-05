import { Uuid } from '@/modules/connection/model/data-type/Uuid'
import { OffsetDateTime } from '@/modules/connection/model/data-type/OffsetDateTime'
import { Duration } from 'luxon'
import { TrafficRecord } from '@/modules/connection/model/traffic/TrafficRecord'
import { TrafficRecordType } from '@/modules/connection/model/traffic/TrafficRecordType'
import { Label } from '@/modules/connection/model/traffic/Label'
import Immutable from 'immutable'

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
