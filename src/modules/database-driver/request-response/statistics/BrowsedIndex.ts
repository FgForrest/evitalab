import { EntityIndexType } from '@/modules/database-driver/request-response/statistics/EntityIndexType'
import { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope'
import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime'

/**
 * One index, as described by an index browse. Carries no heap figure at all - measuring one index is
 * `getIndexDetail`, and it is the expensive call.
 *
 * An index is identified by {@link entityType} together with {@link indexPrimaryKey}, and by nothing else: the
 * handle alone identifies an index only within its owner. {@link discriminator} is for a human to read.
 */
export class BrowsedIndex {

    /**
     * Unset when the index is one the catalog holds itself.
     */
    readonly indexType: EntityIndexType | undefined
    readonly scope: EntityScope
    /**
     * Unset for a global index, which is bound to no reference at all. Not unique on its own.
     */
    readonly referenceName: string | undefined
    readonly discriminatorPrimaryKey: number | undefined
    /**
     * How many entities this index covers. The only size proxy available before measuring - and NOT a stand-in for
     * how much memory the index occupies. Unset for a catalog index, which has no primary-key bitmap.
     */
    readonly entityCount: number | undefined
    /**
     * Stable rendering of everything distinguishing this index from its siblings. Opaque - display, do not parse.
     */
    readonly discriminator: string | undefined
    /**
     * Identity of this index within its owner, and the handle to pass to `getIndexDetail`. Opaque.
     */
    readonly indexPrimaryKey: number
    /**
     * Collection holding this index. Unset for an index the catalog holds itself.
     */
    readonly entityType: string | undefined
    /**
     * How many executed query plans chose this index as part of their winning target index set. Counted since the
     * server loaded the catalog - read it against {@link observedSince}, never on its own.
     */
    readonly queryCount: bigint
    /**
     * How many entity mutations acquired this index for modification.
     */
    readonly updateCount: bigint
    readonly lastQueriedAt: OffsetDateTime | undefined
    readonly lastUpdatedAt: OffsetDateTime | undefined
    /**
     * Whether the four readings above were taken at all - false on a server started with
     * `server.usageStatisticsTracking: false`. A client MUST branch on this before rendering a zero: "not measured"
     * and "never queried" are opposite findings.
     */
    readonly measured: boolean
    /**
     * When observation of this index began. Unset only from a server predating the field, and the window is then
     * unknown - no instant may stand in for it.
     */
    readonly observedSince: OffsetDateTime | undefined

    constructor(
        indexType: EntityIndexType | undefined,
        scope: EntityScope,
        referenceName: string | undefined,
        discriminatorPrimaryKey: number | undefined,
        entityCount: number | undefined,
        discriminator: string | undefined,
        indexPrimaryKey: number,
        entityType: string | undefined,
        queryCount: bigint,
        updateCount: bigint,
        lastQueriedAt: OffsetDateTime | undefined,
        lastUpdatedAt: OffsetDateTime | undefined,
        measured: boolean,
        observedSince: OffsetDateTime | undefined
    ) {
        this.indexType = indexType
        this.scope = scope
        this.referenceName = referenceName
        this.discriminatorPrimaryKey = discriminatorPrimaryKey
        this.entityCount = entityCount
        this.discriminator = discriminator
        this.indexPrimaryKey = indexPrimaryKey
        this.entityType = entityType
        this.queryCount = queryCount
        this.updateCount = updateCount
        this.lastQueriedAt = lastQueriedAt
        this.lastUpdatedAt = lastUpdatedAt
        this.measured = measured
        this.observedSince = observedSince
    }

    /**
     * Stable client-side identity of the row: the owner plus the handle.
     */
    get identity(): string {
        return `${this.entityType ?? ''}:${this.indexPrimaryKey}`
    }
}
