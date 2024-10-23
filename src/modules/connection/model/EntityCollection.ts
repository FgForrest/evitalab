
//TODO: Add documentation
export class EntityCollection {

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
