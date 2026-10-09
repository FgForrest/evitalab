import { StoragePartGroup } from '@/modules/database-driver/request-response/statistics/StoragePartGroup'
import { StoragePartKind } from '@/modules/database-driver/request-response/statistics/StoragePartKind'

/**
 * How much of a data store one storage-part type occupies. Shared by the catalog-level and the collection-level
 * storage composition.
 */
export class StoragePartUsage {

    /**
     * Simple class name of the storage part, e.g. `EntityBodyStoragePart`, `AttributesStoragePart`. An open set
     * that grows with the engine — an identity to show, never one to classify by. Classify by {@link group}.
     */
    readonly storagePartType: string
    readonly count: number
    readonly totalBytes: bigint
    /**
     * What this part type holds, as declared by the server. `undefined` when the server reported a group this
     * build does not know — {@link kind} then still carries the coarse answer.
     */
    readonly group: StoragePartGroup | undefined
    /**
     * The coarse fold of {@link group}, derived from it whenever the group is known. `undefined` only when the
     * server classified the row as nothing at all.
     */
    readonly kind: StoragePartKind | undefined

    constructor(
        storagePartType: string,
        count: number,
        totalBytes: bigint,
        group: StoragePartGroup | undefined,
        kind: StoragePartKind | undefined
    ) {
        this.storagePartType = storagePartType
        this.count = count
        this.totalBytes = totalBytes
        this.group = group
        this.kind = kind
    }

    /**
     * Average size of one record of this type, or `undefined` when the type holds no records.
     */
    get averageBytes(): number | undefined {
        return this.count === 0 ? undefined : Number(this.totalBytes) / this.count
    }
}
