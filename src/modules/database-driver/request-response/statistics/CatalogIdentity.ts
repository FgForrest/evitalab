import { CatalogState } from '@/modules/database-driver/request-response/CatalogState'
import { Uuid } from '@/modules/database-driver/data-type/Uuid'

/**
 * Sentinel the engine reports for a catalog it could not load. The one place the "never render an unavailable value
 * as -1" rule literally applies.
 */
const unusableSentinel: bigint = -1n

/**
 * Who a catalog is and what mode it runs in. Always present on both catalog-level and collection-level snapshots -
 * no other component can be interpreted without it.
 */
export class CatalogIdentity {

    /**
     * Stable identifier assigned at creation; survives renames. Unset when the catalog is unusable.
     */
    readonly catalogId: Uuid | undefined
    /**
     * Unique name of the catalog. Always present, even for a corrupted catalog.
     */
    readonly catalogName: string
    readonly catalogState: CatalogState
    /**
     * Monotonic version incremented by every committed transaction; `-1` when the catalog is unusable - read it
     * through {@link knownCatalogVersion} instead of comparing against the sentinel at the call site.
     */
    readonly catalogVersion: bigint
    readonly readOnly: boolean
    readonly unusable: boolean
    /**
     * Whether writes go through the transactional pipeline. False in `WARMING_UP`.
     */
    readonly transactional: boolean
    readonly goingLive: boolean
    /**
     * Number of entity collections the catalog holds; `-1` when the catalog is unusable - see
     * {@link knownEntityCollectionCount}.
     */
    readonly entityCollectionCount: number

    constructor(
        catalogId: Uuid | undefined,
        catalogName: string,
        catalogState: CatalogState,
        catalogVersion: bigint,
        readOnly: boolean,
        unusable: boolean,
        transactional: boolean,
        goingLive: boolean,
        entityCollectionCount: number
    ) {
        this.catalogId = catalogId
        this.catalogName = catalogName
        this.catalogState = catalogState
        this.catalogVersion = catalogVersion
        this.readOnly = readOnly
        this.unusable = unusable
        this.transactional = transactional
        this.goingLive = goingLive
        this.entityCollectionCount = entityCollectionCount
    }

    /**
     * The catalog version, or `undefined` when the engine reported its unusable-catalog sentinel.
     */
    get knownCatalogVersion(): bigint | undefined {
        return this.catalogVersion === unusableSentinel ? undefined : this.catalogVersion
    }

    /**
     * The collection count, or `undefined` when the engine reported its unusable-catalog sentinel.
     */
    get knownEntityCollectionCount(): number | undefined {
        return this.entityCollectionCount === Number(unusableSentinel) ? undefined : this.entityCollectionCount
    }
}
