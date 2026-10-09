/**
 * One collection's disk footprint. The write-ahead log and the bootstrap file are catalog-wide and have no
 * per-collection counterpart, so they appear at the catalog level only.
 */
export class CollectionStorageSize {

    readonly sizeOnDiskInBytes: bigint
    readonly liveBytes: bigint
    readonly wasteBytes: bigint
    readonly awaitingDeletionBytes: bigint
    readonly unaccountedBytes: bigint

    constructor(
        sizeOnDiskInBytes: bigint,
        liveBytes: bigint,
        wasteBytes: bigint,
        awaitingDeletionBytes: bigint,
        unaccountedBytes: bigint
    ) {
        this.sizeOnDiskInBytes = sizeOnDiskInBytes
        this.liveBytes = liveBytes
        this.wasteBytes = wasteBytes
        this.awaitingDeletionBytes = awaitingDeletionBytes
        this.unaccountedBytes = unaccountedBytes
    }
}
