import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime'

/**
 * Sentinel the engine reports when no history is retained or the newest version could not be determined.
 */
const unknownVersion: bigint = -1n

/**
 * How far back in time the catalog can be read, what that costs on disk, and what is stopping superseded files from
 * going away.
 *
 * {@link activeReaderFloor} - evitaLab's *deletion floor* - is the actionable number: superseded files above it
 * cannot be deleted in either purge mode, so a floor that stops advancing explains disk space that will not come
 * back.
 */
export class HistoryStatistics {

    readonly timeTravelEnabled: boolean
    readonly oldestAvailableCatalogVersion: bigint
    readonly oldestAvailableTimestamp: OffsetDateTime | undefined
    readonly newestCatalogVersion: bigint
    readonly newestTimestamp: OffsetDateTime | undefined
    readonly walFileCount: number
    readonly walBytes: bigint
    readonly activeReaderFloor: bigint
    readonly awaitingDeletionFileCount: number
    readonly awaitingDeletionBytes: bigint
    readonly blockedByActiveReaderBytes: bigint
    readonly purgeableBytes: bigint

    constructor(
        timeTravelEnabled: boolean,
        oldestAvailableCatalogVersion: bigint,
        oldestAvailableTimestamp: OffsetDateTime | undefined,
        newestCatalogVersion: bigint,
        newestTimestamp: OffsetDateTime | undefined,
        walFileCount: number,
        walBytes: bigint,
        activeReaderFloor: bigint,
        awaitingDeletionFileCount: number,
        awaitingDeletionBytes: bigint,
        blockedByActiveReaderBytes: bigint,
        purgeableBytes: bigint
    ) {
        this.timeTravelEnabled = timeTravelEnabled
        this.oldestAvailableCatalogVersion = oldestAvailableCatalogVersion
        this.oldestAvailableTimestamp = oldestAvailableTimestamp
        this.newestCatalogVersion = newestCatalogVersion
        this.newestTimestamp = newestTimestamp
        this.walFileCount = walFileCount
        this.walBytes = walBytes
        this.activeReaderFloor = activeReaderFloor
        this.awaitingDeletionFileCount = awaitingDeletionFileCount
        this.awaitingDeletionBytes = awaitingDeletionBytes
        this.blockedByActiveReaderBytes = blockedByActiveReaderBytes
        this.purgeableBytes = purgeableBytes
    }

    /**
     * The oldest readable catalog version, or `undefined` when no history is retained.
     */
    get knownOldestAvailableCatalogVersion(): bigint | undefined {
        return this.oldestAvailableCatalogVersion === unknownVersion ? undefined : this.oldestAvailableCatalogVersion
    }

    /**
     * The newest catalog version, or `undefined` when it could not be determined.
     */
    get knownNewestCatalogVersion(): bigint | undefined {
        return this.newestCatalogVersion === unknownVersion ? undefined : this.newestCatalogVersion
    }

    /**
     * How many catalog versions the retained history spans, or `undefined` when either end is unknown.
     */
    get retentionWindowVersions(): bigint | undefined {
        const oldest: bigint | undefined = this.knownOldestAvailableCatalogVersion
        const newest: bigint | undefined = this.knownNewestCatalogVersion
        return oldest == undefined || newest == undefined ? undefined : newest - oldest
    }
}
