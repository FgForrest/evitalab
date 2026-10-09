import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime'

/**
 * Fragmentation of ONE data store - one entity collection's, or the catalog's own.
 *
 * {@link activeRecordShare} is derived from the two byte figures reported with it and is NOT the share the compaction
 * predicate is evaluated against. The verdict is {@link compactionEligibleNow}, never a comparison of this share to a
 * threshold.
 */
export class DataStoreFragmentation {

    readonly activeRecordShare: number
    readonly liveBytes: bigint
    readonly wasteBytes: bigint
    readonly compactionEligibleNow: boolean
    readonly wasteBytesGenerated: bigint
    readonly wasteAccumulationRateBytesPerSecond: number
    /**
     * Projected time this data store crosses the predicate. Unset when no crossing follows from the current rate -
     * which never means "never", and must not be replaced by a date.
     */
    readonly estimatedCompactionAt: OffsetDateTime | undefined

    constructor(
        activeRecordShare: number,
        liveBytes: bigint,
        wasteBytes: bigint,
        compactionEligibleNow: boolean,
        wasteBytesGenerated: bigint,
        wasteAccumulationRateBytesPerSecond: number,
        estimatedCompactionAt: OffsetDateTime | undefined
    ) {
        this.activeRecordShare = activeRecordShare
        this.liveBytes = liveBytes
        this.wasteBytes = wasteBytes
        this.compactionEligibleNow = compactionEligibleNow
        this.wasteBytesGenerated = wasteBytesGenerated
        this.wasteAccumulationRateBytesPerSecond = wasteAccumulationRateBytesPerSecond
        this.estimatedCompactionAt = estimatedCompactionAt
    }
}
