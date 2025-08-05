import { EntityCollectionStatistics } from './EntityCollectionStatistics'
import { List as ImmutableList } from 'immutable'
import { CatalogState } from '@/modules/database-driver/request-response/CatalogState'
import type { MutationProgressType } from '@/modules/connection-explorer/model/MutationProgressType.ts'

/**
 * evitaLab's representation of a single evitaDB catalog instance independent of specific evitaDB version
 */
export class CatalogStatistics {
    /**
     * Returns unique catalog id that doesn't change with catalog schema changes - such as renaming.
     * The id is assigned to the catalog when it is created and never changes.
     */
    readonly catalogId: string | undefined
    /**
     * Catalog header version that is incremented with each update. Version is not stored on the disk, it serves only to distinguish whether there is any change made in the header and whether it needs to be persisted on disk.
     */
    readonly version: bigint
    /**
     * Name of the catalog. Name must be unique across all catalogs inside same evitaDB instance.
     * This is a mandatory value, it cannot be omitted.
     */
    readonly name: string
    /**
     * Set of all maintained entity collections - i.e. entity types.
     */
    readonly entityCollectionStatistics: ImmutableList<EntityCollectionStatistics>
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
    /**
     * true if the catalog is read-only, false otherwise
    */
    readonly readOnly : boolean
    /**
     * true if the catalog is unusable, false otherwise
     */
    readonly unusable: boolean
    readonly progresses: Map<MutationProgressType, number>
    constructor(
        catalogId: string | undefined,
        version: bigint,
        name: string,
        entityCollectionStatistics: ImmutableList<EntityCollectionStatistics>,
        corrupted: boolean,
        catalogState: CatalogState,
        totalRecords: bigint,
        indexCount: bigint,
        sizeOnDisk: bigint,
        readOnly: boolean,
        unusable: boolean
    ) {
        this.catalogId = catalogId
        this.version = version
        this.name = name
        this.entityCollectionStatistics = entityCollectionStatistics
        this.corrupted = corrupted
        this.catalogState = catalogState
        this.totalRecords = totalRecords
        this.indexCount = indexCount
        this.sizeOnDisk = sizeOnDisk
        this.readOnly = readOnly
        this.unusable = unusable
        this.progresses = new Map<MutationProgressType, number>()
    }

    get isInWarmup(): boolean {
        return this.catalogState === CatalogState.WarmingUp
    }

    setProgress(type: MutationProgressType, value: number):void {
        if(value !== 100)
            this.progresses.set(type, value)
        else
            this.progresses.delete(type)
    }

    removeProgress(type: MutationProgressType):void {
        this.progresses.delete(type)
    }
}
