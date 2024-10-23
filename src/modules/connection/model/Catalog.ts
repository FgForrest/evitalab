import { CatalogState } from '@/modules/connection/model/CatalogState'
import { EntityCollection } from './EntityCollection'
import Immutable from 'immutable'

/**
 * evitaLab's representation of a single evitaDB catalog instance independent of specific evitaDB version
 */
export class Catalog {
    /**
     * Returns unique catalog id that doesn't change with catalog schema changes - such as renaming.
     * The id is assigned to the catalog when it is created and never changes.
     */
    readonly catalogId: string | undefined
    /**
     * Catalog header version that is incremented with each update. Version is not stored on the disk, it serves only to distinguish whether there is any change made in the header and whether it needs to be persisted on disk.
     */
    readonly version: BigInt
    /**
     * Name of the catalog. Name must be unique across all catalogs inside same evitaDB instance.
     * This is a mandatory value, it cannot be omitted.
     */
    readonly name: string
    /**
     * Set of all maintained entity collections - i.e. entity types.
     */
    readonly entityCollections: Immutable.List<EntityCollection>
    /**
     * Whether this catalog is corrupted or can be freely used.
     */
    readonly corrupted: boolean
    /**
     * Current catalog state
     */
    readonly catalogState: CatalogState

    /**
     * Total record count
     */
    readonly totalRecords: bigint

    readonly indexCount: bigint

    readonly sizeOnDisk: bigint

    constructor(
        catalogId: string | undefined,
        version: BigInt,
        name: string,
        entityCollections: Immutable.List<EntityCollection>,
        corrupted: boolean,
        catalogState: CatalogState,
        totalRecords: bigint,
        indexCount: bigint,
        sizeOnDisk: bigint
    ) {
        this.catalogId = catalogId
        this.version = version
        this.name = name
        this.entityCollections = entityCollections
        this.corrupted = corrupted
        this.catalogState = catalogState
        this.totalRecords = totalRecords
        this.indexCount = indexCount
        this.sizeOnDisk = sizeOnDisk
    }

    get isInWarmup(): boolean {
        return this.catalogState === CatalogState.WarmingUp
    }
}
