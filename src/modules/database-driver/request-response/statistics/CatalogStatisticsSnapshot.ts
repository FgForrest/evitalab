import { Map as ImmutableMap } from 'immutable'
import { CatalogIdentity } from '@/modules/database-driver/request-response/statistics/CatalogIdentity'
import {
    CatalogStatisticsComponent
} from '@/modules/database-driver/request-response/statistics/CatalogStatisticsComponent'
import { ComponentStatus } from '@/modules/database-driver/request-response/statistics/ComponentStatus'
import { RecordCounts } from '@/modules/database-driver/request-response/statistics/RecordCounts'
import { CollectionInfo } from '@/modules/database-driver/request-response/statistics/CollectionInfo'
import { SessionStatistics } from '@/modules/database-driver/request-response/statistics/SessionStatistics'
import {
    CommitPipelineStatistics
} from '@/modules/database-driver/request-response/statistics/CommitPipelineStatistics'
import { ActivityStatistics } from '@/modules/database-driver/request-response/statistics/ActivityStatistics'
import { StorageSizeStatistics } from '@/modules/database-driver/request-response/statistics/StorageSizeStatistics'
import {
    StorageCompositionStatistics
} from '@/modules/database-driver/request-response/statistics/StorageCompositionStatistics'
import {
    FragmentationStatistics
} from '@/modules/database-driver/request-response/statistics/FragmentationStatistics'
import { HistoryStatistics } from '@/modules/database-driver/request-response/statistics/HistoryStatistics'
import {
    IndexSummaryStatistics
} from '@/modules/database-driver/request-response/statistics/IndexSummaryStatistics'
import {
    VolatileStateStatistics
} from '@/modules/database-driver/request-response/statistics/VolatileStateStatistics'
import { DurabilityStatistics } from '@/modules/database-driver/request-response/statistics/DurabilityStatistics'
import {
    CatalogIndexCardinality
} from '@/modules/database-driver/request-response/statistics/CatalogIndexCardinality'
import { List as ImmutableList } from 'immutable'

/**
 * A component-selected snapshot of one catalog's statistics.
 *
 * {@link identity} is always present. Every other component is present only when it was both requested and
 * delivered - a sub-message whose fields are all zero is a real measurement, not a placeholder. Whether an absent
 * component was never asked for or could not be computed is answered by {@link statusOf} alone.
 */
export class CatalogStatisticsSnapshot {

    readonly identity: CatalogIdentity
    readonly recordCounts: RecordCounts | undefined
    readonly collections: ImmutableList<CollectionInfo> | undefined
    readonly sessions: SessionStatistics | undefined
    readonly commitPipeline: CommitPipelineStatistics | undefined
    readonly activity: ActivityStatistics | undefined
    readonly storageSize: StorageSizeStatistics | undefined
    readonly storageComposition: StorageCompositionStatistics | undefined
    readonly fragmentation: FragmentationStatistics | undefined
    readonly history: HistoryStatistics | undefined
    readonly indexSummary: IndexSummaryStatistics | undefined
    readonly volatileState: VolatileStateStatistics | undefined
    readonly durability: DurabilityStatistics | undefined
    readonly indexCardinality: CatalogIndexCardinality | undefined
    /**
     * Outcome of every requested component. Components that were not requested have no entry at all.
     */
    readonly componentStatus: ImmutableMap<CatalogStatisticsComponent, ComponentStatus>

    constructor(
        identity: CatalogIdentity,
        recordCounts: RecordCounts | undefined,
        collections: ImmutableList<CollectionInfo> | undefined,
        sessions: SessionStatistics | undefined,
        commitPipeline: CommitPipelineStatistics | undefined,
        activity: ActivityStatistics | undefined,
        storageSize: StorageSizeStatistics | undefined,
        storageComposition: StorageCompositionStatistics | undefined,
        fragmentation: FragmentationStatistics | undefined,
        history: HistoryStatistics | undefined,
        indexSummary: IndexSummaryStatistics | undefined,
        volatileState: VolatileStateStatistics | undefined,
        durability: DurabilityStatistics | undefined,
        indexCardinality: CatalogIndexCardinality | undefined,
        componentStatus: ImmutableMap<CatalogStatisticsComponent, ComponentStatus>
    ) {
        this.identity = identity
        this.recordCounts = recordCounts
        this.collections = collections
        this.sessions = sessions
        this.commitPipeline = commitPipeline
        this.activity = activity
        this.storageSize = storageSize
        this.storageComposition = storageComposition
        this.fragmentation = fragmentation
        this.history = history
        this.indexSummary = indexSummary
        this.volatileState = volatileState
        this.durability = durability
        this.indexCardinality = indexCardinality
        this.componentStatus = componentStatus
    }

    /**
     * Status of one requested component, or `undefined` when this snapshot never asked for it.
     */
    statusOf(component: CatalogStatisticsComponent): ComponentStatus | undefined {
        return this.componentStatus.get(component)
    }
}
