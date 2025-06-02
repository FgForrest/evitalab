/**
 * Aggregates basic data about the catalog and entity types stored in it.
 */
export class EntityCollectionStatistics {

    readonly entityType: string
    readonly totalRecords: number
    readonly indexCount: number
    readonly sizeOnDiskInBytes: bigint

    constructor(
        entityType: string,
        totalRecords: number,
        indexCount: number,
        sizeOnDiskInBytes: bigint
    ) {
        this.entityType = entityType
        this.totalRecords = totalRecords
        this.indexCount = indexCount
        this.sizeOnDiskInBytes = sizeOnDiskInBytes
    }
}
