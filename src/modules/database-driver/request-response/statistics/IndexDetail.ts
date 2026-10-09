import { IndexCardinality } from '@/modules/database-driver/request-response/statistics/IndexCardinality'
import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime'

/**
 * Everything worth knowing about one index: what it occupies, and whether it is earning it. The expensive
 * drill-down that follows an index browse - about 4 microseconds for the median index, 151 ms for the worst one
 * measured on a production catalog.
 */
export class IndexDetail {

    readonly indexPrimaryKey: number
    /**
     * Best-effort estimate of the heap this index occupies. Computed rather than measured, and deliberately
     * conservative: structure shared with a superseded version of an index is charged in full, because that
     * predecessor is garbage waiting to be collected.
     */
    readonly heapSizeInBytes: bigint
    readonly cardinality: IndexCardinality | undefined
    /**
     * Collection holding the described index. Unset for an index the catalog holds itself.
     */
    readonly entityType: string | undefined
    readonly queryCount: bigint
    readonly updateCount: bigint
    readonly lastQueriedAt: OffsetDateTime | undefined
    readonly lastUpdatedAt: OffsetDateTime | undefined
    /**
     * Whether the usage readings were taken at all - see {@link BrowsedIndex.measured}.
     */
    readonly measured: boolean
    readonly observedSince: OffsetDateTime | undefined

    constructor(
        indexPrimaryKey: number,
        heapSizeInBytes: bigint,
        cardinality: IndexCardinality | undefined,
        entityType: string | undefined,
        queryCount: bigint,
        updateCount: bigint,
        lastQueriedAt: OffsetDateTime | undefined,
        lastUpdatedAt: OffsetDateTime | undefined,
        measured: boolean,
        observedSince: OffsetDateTime | undefined
    ) {
        this.indexPrimaryKey = indexPrimaryKey
        this.heapSizeInBytes = heapSizeInBytes
        this.cardinality = cardinality
        this.entityType = entityType
        this.queryCount = queryCount
        this.updateCount = updateCount
        this.lastQueriedAt = lastQueriedAt
        this.lastUpdatedAt = lastUpdatedAt
        this.measured = measured
        this.observedSince = observedSince
    }
}
