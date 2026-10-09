/**
 * A catalog's disk footprint broken into the classes that have different remedies. The total is measured, not
 * derived - it is the sum of the lengths of every file in the catalog directory, so it equals the sum of the other
 * fields by construction.
 *
 * Delivered even when the catalog is unusable: file lengths are readable whether or not the catalog loads.
 */
export class StorageSizeStatistics {

    readonly sizeOnDiskInBytes: bigint
    readonly liveBytes: bigint
    readonly wasteBytes: bigint
    readonly walBytes: bigint
    readonly awaitingDeletionBytes: bigint
    readonly blockedByActiveReaderBytes: bigint
    readonly purgeableBytes: bigint
    readonly bootstrapBytes: bigint
    readonly unaccountedBytes: bigint
    readonly catalogDataStoreLiveBytes: bigint
    readonly catalogDataStoreWasteBytes: bigint

    constructor(
        sizeOnDiskInBytes: bigint,
        liveBytes: bigint,
        wasteBytes: bigint,
        walBytes: bigint,
        awaitingDeletionBytes: bigint,
        blockedByActiveReaderBytes: bigint,
        purgeableBytes: bigint,
        bootstrapBytes: bigint,
        unaccountedBytes: bigint,
        catalogDataStoreLiveBytes: bigint,
        catalogDataStoreWasteBytes: bigint
    ) {
        this.sizeOnDiskInBytes = sizeOnDiskInBytes
        this.liveBytes = liveBytes
        this.wasteBytes = wasteBytes
        this.walBytes = walBytes
        this.awaitingDeletionBytes = awaitingDeletionBytes
        this.blockedByActiveReaderBytes = blockedByActiveReaderBytes
        this.purgeableBytes = purgeableBytes
        this.bootstrapBytes = bootstrapBytes
        this.unaccountedBytes = unaccountedBytes
        this.catalogDataStoreLiveBytes = catalogDataStoreLiveBytes
        this.catalogDataStoreWasteBytes = catalogDataStoreWasteBytes
    }
}
