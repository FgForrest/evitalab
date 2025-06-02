import { Duration } from 'luxon'
import { TrafficRecord } from '@/modules/database-driver/request-response/traffic-recording/TrafficRecord'
import { Uuid } from '@/modules/database-driver/data-type/Uuid'
import { TrafficRecordType } from '@/modules/database-driver/request-response/traffic-recording/TrafficRecordType'
import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime'

/**
 * This container holds a mutation and its metadata.
 */
export class MutationContainer extends TrafficRecord {

    /**
     * Serialized mutation operation.
     */
    readonly serializedMutation: object

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
                serializedMutation: object) {
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
        this.serializedMutation = serializedMutation
    }
}
