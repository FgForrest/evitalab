import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime'
import { DataStoreFragmentation } from '@/modules/database-driver/request-response/statistics/DataStoreFragmentation'

/**
 * How much of the catalog's data is still live, how fast that is getting worse, and when the engine will act on it.
 *
 * Every figure is folded across the catalog's own data store and every collection's, so on its own it cannot say
 * WHERE the fragmentation is. The configured thresholds driving the compaction predicate are reported alongside the
 * measurements, so a view draws the server's own thresholds rather than a copy that drifts.
 */
export class FragmentationStatistics {

    /**
     * Catalog-wide `liveBytes / (liveBytes + wasteBytes)`. A catalog-wide aggregate - it must NOT be compared to the
     * thresholds below, which the engine evaluates per data file. Take the verdict from
     * {@link compactionEligibleNow} alone.
     */
    readonly activeRecordShare: number
    readonly liveBytes: bigint
    readonly wasteBytes: bigint
    /**
     * True when at least one data store of this catalog already satisfies the compaction predicate.
     */
    readonly compactionEligibleNow: boolean
    readonly fileSizeCompactionThresholdBytes: bigint
    readonly wasteBytesGenerated: bigint
    readonly wasteAccumulationRateBytesPerSecond: number
    readonly estimatedCompactionAt: OffsetDateTime | undefined
    readonly minimalActiveRecordShare: number
    readonly maxWasteActiveShare: number
    readonly minCompactionIntervalMilliseconds: bigint
    /**
     * The same measurements for the catalog's own data store alone - the slice that belongs to no entity collection.
     */
    readonly catalogDataStore: DataStoreFragmentation | undefined

    constructor(
        activeRecordShare: number,
        liveBytes: bigint,
        wasteBytes: bigint,
        compactionEligibleNow: boolean,
        fileSizeCompactionThresholdBytes: bigint,
        wasteBytesGenerated: bigint,
        wasteAccumulationRateBytesPerSecond: number,
        estimatedCompactionAt: OffsetDateTime | undefined,
        minimalActiveRecordShare: number,
        maxWasteActiveShare: number,
        minCompactionIntervalMilliseconds: bigint,
        catalogDataStore: DataStoreFragmentation | undefined
    ) {
        this.activeRecordShare = activeRecordShare
        this.liveBytes = liveBytes
        this.wasteBytes = wasteBytes
        this.compactionEligibleNow = compactionEligibleNow
        this.fileSizeCompactionThresholdBytes = fileSizeCompactionThresholdBytes
        this.wasteBytesGenerated = wasteBytesGenerated
        this.wasteAccumulationRateBytesPerSecond = wasteAccumulationRateBytesPerSecond
        this.estimatedCompactionAt = estimatedCompactionAt
        this.minimalActiveRecordShare = minimalActiveRecordShare
        this.maxWasteActiveShare = maxWasteActiveShare
        this.minCompactionIntervalMilliseconds = minCompactionIntervalMilliseconds
        this.catalogDataStore = catalogDataStore
    }
}
