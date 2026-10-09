import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime'
import { DataStoreVolatileState } from '@/modules/database-driver/request-response/statistics/DataStoreVolatileState'

/**
 * What the whole catalog holds in memory but not yet on disk. `oldestRecordKeptTimestamp` is the one to watch - the
 * multi-version history retained for still-open sessions is the part of the heap that grows silently.
 */
export class VolatileStateStatistics {

    readonly totalSizeIncludingVolatileDataBytes: bigint
    readonly nonFlushedRecordCount: number
    readonly nonFlushedSizeBytes: bigint
    readonly oldestRecordKeptTimestamp: OffsetDateTime | undefined
    /**
     * The same state for the catalog's own data store alone.
     */
    readonly catalogDataStore: DataStoreVolatileState | undefined

    constructor(
        totalSizeIncludingVolatileDataBytes: bigint,
        nonFlushedRecordCount: number,
        nonFlushedSizeBytes: bigint,
        oldestRecordKeptTimestamp: OffsetDateTime | undefined,
        catalogDataStore: DataStoreVolatileState | undefined
    ) {
        this.totalSizeIncludingVolatileDataBytes = totalSizeIncludingVolatileDataBytes
        this.nonFlushedRecordCount = nonFlushedRecordCount
        this.nonFlushedSizeBytes = nonFlushedSizeBytes
        this.oldestRecordKeptTimestamp = oldestRecordKeptTimestamp
        this.catalogDataStore = catalogDataStore
    }
}
