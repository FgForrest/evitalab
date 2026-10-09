import { Map as ImmutableMap } from 'immutable'
import { CatalogIdentity } from '@/modules/database-driver/request-response/statistics/CatalogIdentity'
import {
    CatalogStatisticsComponent
} from '@/modules/database-driver/request-response/statistics/CatalogStatisticsComponent'
import { ComponentStatus } from '@/modules/database-driver/request-response/statistics/ComponentStatus'
import { CollectionHeaderInfo } from '@/modules/database-driver/request-response/statistics/CollectionHeaderInfo'
import {
    CollectionRecordCounts
} from '@/modules/database-driver/request-response/statistics/CollectionRecordCounts'
import { CollectionStorageSize } from '@/modules/database-driver/request-response/statistics/CollectionStorageSize'
import {
    CollectionStorageComposition
} from '@/modules/database-driver/request-response/statistics/CollectionStorageComposition'
import {
    DataStoreFragmentation
} from '@/modules/database-driver/request-response/statistics/DataStoreFragmentation'
import { CollectionIndexSummary } from '@/modules/database-driver/request-response/statistics/CollectionIndexSummary'
import {
    DataStoreVolatileState
} from '@/modules/database-driver/request-response/statistics/DataStoreVolatileState'
import {
    CollectionIndexCardinality
} from '@/modules/database-driver/request-response/statistics/CollectionIndexCardinality'

/**
 * A component-selected snapshot of exactly one entity collection's statistics. Presence rules match the catalog-level
 * snapshot - {@link identity} and {@link entityType} are always set, everything else only when its component was
 * requested and delivered.
 */
export class EntityCollectionStatisticsSnapshot {

    readonly identity: CatalogIdentity
    readonly entityType: string
    readonly header: CollectionHeaderInfo | undefined
    readonly recordCounts: CollectionRecordCounts | undefined
    readonly storageSize: CollectionStorageSize | undefined
    readonly storageComposition: CollectionStorageComposition | undefined
    readonly fragmentation: DataStoreFragmentation | undefined
    readonly indexSummary: CollectionIndexSummary | undefined
    readonly volatileState: DataStoreVolatileState | undefined
    readonly indexCardinality: CollectionIndexCardinality | undefined
    readonly componentStatus: ImmutableMap<CatalogStatisticsComponent, ComponentStatus>

    constructor(
        identity: CatalogIdentity,
        entityType: string,
        header: CollectionHeaderInfo | undefined,
        recordCounts: CollectionRecordCounts | undefined,
        storageSize: CollectionStorageSize | undefined,
        storageComposition: CollectionStorageComposition | undefined,
        fragmentation: DataStoreFragmentation | undefined,
        indexSummary: CollectionIndexSummary | undefined,
        volatileState: DataStoreVolatileState | undefined,
        indexCardinality: CollectionIndexCardinality | undefined,
        componentStatus: ImmutableMap<CatalogStatisticsComponent, ComponentStatus>
    ) {
        this.identity = identity
        this.entityType = entityType
        this.header = header
        this.recordCounts = recordCounts
        this.storageSize = storageSize
        this.storageComposition = storageComposition
        this.fragmentation = fragmentation
        this.indexSummary = indexSummary
        this.volatileState = volatileState
        this.indexCardinality = indexCardinality
        this.componentStatus = componentStatus
    }

    statusOf(component: CatalogStatisticsComponent): ComponentStatus | undefined {
        return this.componentStatus.get(component)
    }
}
