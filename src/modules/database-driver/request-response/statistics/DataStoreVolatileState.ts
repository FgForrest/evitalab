import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime'

/**
 * What one data store holds in memory but not yet on disk, and what it keeps alive purely for readers that started
 * long ago.
 */
export class DataStoreVolatileState {

    readonly totalSizeIncludingVolatileDataBytes: bigint
    readonly nonFlushedRecordCount: number
    readonly nonFlushedSizeBytes: bigint
    /**
     * Creation time of the oldest record kept alive for an open session. Unset when nothing is being retained.
     */
    readonly oldestRecordKeptTimestamp: OffsetDateTime | undefined

    constructor(
        totalSizeIncludingVolatileDataBytes: bigint,
        nonFlushedRecordCount: number,
        nonFlushedSizeBytes: bigint,
        oldestRecordKeptTimestamp: OffsetDateTime | undefined
    ) {
        this.totalSizeIncludingVolatileDataBytes = totalSizeIncludingVolatileDataBytes
        this.nonFlushedRecordCount = nonFlushedRecordCount
        this.nonFlushedSizeBytes = nonFlushedSizeBytes
        this.oldestRecordKeptTimestamp = oldestRecordKeptTimestamp
    }
}
