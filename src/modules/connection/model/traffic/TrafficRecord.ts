import { Uuid } from '@/modules/connection/model/data-type/Uuid'
import { TrafficRecordType } from '@/modules/connection/model/traffic/TrafficRecordType'
import { OffsetDateTime } from '@/modules/connection/model/data-type/OffsetDateTime'
import { Duration } from 'luxon'

/**
 * Represents a single record of traffic recording
 */
export abstract class TrafficRecord {

    readonly sessionSequenceOrder: bigint
    readonly sessionId: Uuid
    readonly recordSessionOffset: number
    readonly sessionRecordsCount: number
    readonly type: TrafficRecordType
    readonly created: OffsetDateTime
    readonly duration: Duration
    readonly ioFetchedSizeBytes: number
    readonly ioFetchCount: number
    readonly finishedWithError?: string

    protected constructor(sessionSequenceOrder: bigint,
                          sessionId: Uuid,
                          recordSessionOffset: number,
                          sessionRecordsCount: number,
                          type: TrafficRecordType,
                          created: OffsetDateTime,
                          duration: Duration,
                          ioFetchedSizeBytes: number,
                          ioFetchCount: number,
                          finishedWithError: string | undefined) {
        this.sessionSequenceOrder = sessionSequenceOrder
        this.sessionId = sessionId
        this.recordSessionOffset = recordSessionOffset
        this.sessionRecordsCount = sessionRecordsCount
        this.type = type
        this.created = created
        this.duration = duration
        this.ioFetchedSizeBytes = ioFetchedSizeBytes
        this.ioFetchCount = ioFetchCount
        this.finishedWithError = finishedWithError
    }
}
