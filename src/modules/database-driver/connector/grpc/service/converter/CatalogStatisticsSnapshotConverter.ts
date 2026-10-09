import { List as ImmutableList, Map as ImmutableMap } from 'immutable'
import type {
    GrpcActivityStatistics,
    GrpcAttributeCardinality,
    GrpcBrowsedIndex,
    GrpcCatalogIdentity,
    GrpcCatalogIndexCardinality,
    GrpcCatalogStatisticsSnapshot,
    GrpcCollectionHeaderInfo,
    GrpcCollectionIndexCardinality,
    GrpcCollectionIndexSummary,
    GrpcCollectionRecordCounts,
    GrpcCollectionStorageComposition,
    GrpcCollectionStorageSize,
    GrpcCommitPipelineStatistics,
    GrpcComponentStatus,
    GrpcDataStoreFragmentation,
    GrpcDataStoreVolatileState,
    GrpcDurabilityStatistics,
    GrpcEntityCollectionStatisticsSnapshot,
    GrpcFragmentationStatistics,
    GrpcGlobalUniqueIndexCardinality,
    GrpcHistoryStatistics,
    GrpcIndexCardinality,
    GrpcIndexDetail,
    GrpcIndexSummaryStatistics,
    GrpcIndexTypeCount,
    GrpcRecordCounts,
    GrpcSessionStatistics,
    GrpcStorageCompositionStatistics,
    GrpcStoragePartUsage,
    GrpcStorageSizeStatistics,
    GrpcVolatileStateStatistics
} from '@/modules/database-driver/connector/grpc/gen/GrpcStatistics_pb'
import type { GrpcIndexBrowseResponse } from '@/modules/database-driver/connector/grpc/gen/GrpcEvitaManagementAPI_pb'
import {
    GrpcAttributeIndexType,
    GrpcCatalogStatisticsComponent,
    GrpcComponentAvailability,
    GrpcEntityIndexType,
    GrpcIndexBrowseOrdering,
    GrpcOrderDirection,
    GrpcStoragePartGroup,
    GrpcStoragePartKind
} from '@/modules/database-driver/connector/grpc/gen/GrpcEnums_pb'
import type { GrpcOffsetDateTime } from '@/modules/database-driver/connector/grpc/gen/GrpcEvitaDataTypes_pb'
import { EvitaValueConverter } from '@/modules/database-driver/connector/grpc/service/converter/EvitaValueConverter'
import { ScopesConverter } from '@/modules/database-driver/connector/grpc/service/converter/ScopesConverter'
import {
    CatalogStatisticsConverter
} from '@/modules/database-driver/connector/grpc/service/converter/CatalogStatisticsConverter'
import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { CatalogIdentity } from '@/modules/database-driver/request-response/statistics/CatalogIdentity'
import {
    CatalogStatisticsComponent
} from '@/modules/database-driver/request-response/statistics/CatalogStatisticsComponent'
import { ComponentAvailability } from '@/modules/database-driver/request-response/statistics/ComponentAvailability'
import { ComponentStatus } from '@/modules/database-driver/request-response/statistics/ComponentStatus'
import { RecordCounts } from '@/modules/database-driver/request-response/statistics/RecordCounts'
import { CollectionInfo } from '@/modules/database-driver/request-response/statistics/CollectionInfo'
import { SessionStatistics } from '@/modules/database-driver/request-response/statistics/SessionStatistics'
import {
    CommitPipelineStatistics
} from '@/modules/database-driver/request-response/statistics/CommitPipelineStatistics'
import { ActivityStatistics } from '@/modules/database-driver/request-response/statistics/ActivityStatistics'
import { StorageSizeStatistics } from '@/modules/database-driver/request-response/statistics/StorageSizeStatistics'
import { StoragePartUsage } from '@/modules/database-driver/request-response/statistics/StoragePartUsage'
import { StoragePartGroup } from '@/modules/database-driver/request-response/statistics/StoragePartGroup'
import {
    StoragePartKind,
    storagePartKindOf
} from '@/modules/database-driver/request-response/statistics/StoragePartKind'
import {
    StorageCompositionStatistics
} from '@/modules/database-driver/request-response/statistics/StorageCompositionStatistics'
import {
    DataStoreFragmentation
} from '@/modules/database-driver/request-response/statistics/DataStoreFragmentation'
import {
    FragmentationStatistics
} from '@/modules/database-driver/request-response/statistics/FragmentationStatistics'
import { HistoryStatistics } from '@/modules/database-driver/request-response/statistics/HistoryStatistics'
import {
    IndexSummaryStatistics
} from '@/modules/database-driver/request-response/statistics/IndexSummaryStatistics'
import {
    DataStoreVolatileState
} from '@/modules/database-driver/request-response/statistics/DataStoreVolatileState'
import {
    VolatileStateStatistics
} from '@/modules/database-driver/request-response/statistics/VolatileStateStatistics'
import { DurabilityStatistics } from '@/modules/database-driver/request-response/statistics/DurabilityStatistics'
import {
    GlobalUniqueIndexCardinality
} from '@/modules/database-driver/request-response/statistics/GlobalUniqueIndexCardinality'
import {
    CatalogIndexCardinality
} from '@/modules/database-driver/request-response/statistics/CatalogIndexCardinality'
import {
    CatalogStatisticsSnapshot
} from '@/modules/database-driver/request-response/statistics/CatalogStatisticsSnapshot'
import { CollectionHeaderInfo } from '@/modules/database-driver/request-response/statistics/CollectionHeaderInfo'
import {
    CollectionRecordCounts
} from '@/modules/database-driver/request-response/statistics/CollectionRecordCounts'
import { CollectionStorageSize } from '@/modules/database-driver/request-response/statistics/CollectionStorageSize'
import {
    CollectionStorageComposition
} from '@/modules/database-driver/request-response/statistics/CollectionStorageComposition'
import { EntityIndexType } from '@/modules/database-driver/request-response/statistics/EntityIndexType'
import { AttributeIndexType } from '@/modules/database-driver/request-response/statistics/AttributeIndexType'
import { IndexBrowseOrdering } from '@/modules/database-driver/request-response/statistics/IndexBrowseOrdering'
import { IndexTypeCount } from '@/modules/database-driver/request-response/statistics/IndexTypeCount'
import { CollectionIndexSummary } from '@/modules/database-driver/request-response/statistics/CollectionIndexSummary'
import { AttributeCardinality } from '@/modules/database-driver/request-response/statistics/AttributeCardinality'
import { IndexCardinality } from '@/modules/database-driver/request-response/statistics/IndexCardinality'
import {
    CollectionIndexCardinality
} from '@/modules/database-driver/request-response/statistics/CollectionIndexCardinality'
import {
    EntityCollectionStatisticsSnapshot
} from '@/modules/database-driver/request-response/statistics/EntityCollectionStatisticsSnapshot'
import { BrowsedIndex } from '@/modules/database-driver/request-response/statistics/BrowsedIndex'
import { BrowsedIndexPage } from '@/modules/database-driver/request-response/statistics/BrowsedIndexPage'
import { IndexDetail } from '@/modules/database-driver/request-response/statistics/IndexDetail'
import { OrderDirection } from '@/modules/database-driver/request-response/schema/OrderDirection'

/**
 * Converts the component-selected statistics snapshots, index browse pages and index details of
 * `EvitaManagementService` into evitaLab's internal model.
 *
 * Two conversion rules are load-bearing and must not be "simplified":
 *
 * - an **absent** optional wire field becomes `undefined`, never `0` — the engine reports genuine absence that way
 *   on purpose, and `0` is a different claim (see `GrpcBrowsedIndex.entityCount`);
 * - an **absent** `measured` flag decodes as `true`, because a server predating the flag always measured.
 */
export class CatalogStatisticsSnapshotConverter {

    private readonly catalogStatisticsConverterProvider: () => CatalogStatisticsConverter

    constructor(catalogStatisticsConverterProvider: () => CatalogStatisticsConverter) {
        this.catalogStatisticsConverterProvider = catalogStatisticsConverterProvider
    }

    convertCatalogSnapshot(snapshot: GrpcCatalogStatisticsSnapshot): CatalogStatisticsSnapshot {
        return new CatalogStatisticsSnapshot(
            this.convertIdentity(snapshot.identity),
            snapshot.recordCounts != undefined ? this.convertRecordCounts(snapshot.recordCounts) : undefined,
            snapshot.collections != undefined
                ? ImmutableList(
                    snapshot.collections.collections.map(it =>
                        new CollectionInfo(it.entityType, it.entityTypePrimaryKey))
                )
                : undefined,
            snapshot.sessions != undefined ? this.convertSessions(snapshot.sessions) : undefined,
            snapshot.commitPipeline != undefined ? this.convertCommitPipeline(snapshot.commitPipeline) : undefined,
            snapshot.activity != undefined ? this.convertActivity(snapshot.activity) : undefined,
            snapshot.storageSize != undefined ? this.convertStorageSize(snapshot.storageSize) : undefined,
            snapshot.storageComposition != undefined
                ? this.convertStorageComposition(snapshot.storageComposition)
                : undefined,
            snapshot.fragmentation != undefined ? this.convertFragmentation(snapshot.fragmentation) : undefined,
            snapshot.history != undefined ? this.convertHistory(snapshot.history) : undefined,
            snapshot.indexSummary != undefined ? this.convertIndexSummary(snapshot.indexSummary) : undefined,
            snapshot.volatileState != undefined ? this.convertVolatileState(snapshot.volatileState) : undefined,
            snapshot.durability != undefined ? this.convertDurability(snapshot.durability) : undefined,
            snapshot.indexCardinality != undefined
                ? this.convertCatalogIndexCardinality(snapshot.indexCardinality)
                : undefined,
            this.convertComponentStatuses(snapshot.componentStatus)
        )
    }

    convertCollectionSnapshot(
        snapshot: GrpcEntityCollectionStatisticsSnapshot
    ): EntityCollectionStatisticsSnapshot {
        return new EntityCollectionStatisticsSnapshot(
            this.convertIdentity(snapshot.identity),
            snapshot.entityType,
            snapshot.header != undefined ? this.convertCollectionHeader(snapshot.header) : undefined,
            snapshot.recordCounts != undefined
                ? this.convertCollectionRecordCounts(snapshot.recordCounts)
                : undefined,
            snapshot.storageSize != undefined ? this.convertCollectionStorageSize(snapshot.storageSize) : undefined,
            snapshot.storageComposition != undefined
                ? this.convertCollectionStorageComposition(snapshot.storageComposition)
                : undefined,
            snapshot.fragmentation != undefined
                ? this.convertDataStoreFragmentation(snapshot.fragmentation)
                : undefined,
            snapshot.indexSummary != undefined
                ? this.convertCollectionIndexSummary(snapshot.indexSummary)
                : undefined,
            snapshot.volatileState != undefined
                ? this.convertDataStoreVolatileState(snapshot.volatileState)
                : undefined,
            snapshot.indexCardinality != undefined
                ? this.convertCollectionIndexCardinality(snapshot.indexCardinality)
                : undefined,
            this.convertComponentStatuses(snapshot.componentStatus)
        )
    }

    convertIndexBrowsePage(response: GrpcIndexBrowseResponse): BrowsedIndexPage {
        return new BrowsedIndexPage(
            ImmutableList(response.indexes.map(it => this.convertBrowsedIndex(it))),
            response.pageNumber,
            response.pageSize,
            response.totalRecordCount,
            BigInt(response.catalogVersion)
        )
    }

    convertIndexDetail(detail: GrpcIndexDetail): IndexDetail {
        return new IndexDetail(
            detail.indexPrimaryKey,
            BigInt(detail.heapSizeInBytes),
            detail.cardinality != undefined ? this.convertIndexCardinality(detail.cardinality) : undefined,
            detail.entityType,
            BigInt(detail.queryCount),
            BigInt(detail.updateCount),
            this.convertOptionalDateTime(detail.lastQueriedAt),
            this.convertOptionalDateTime(detail.lastUpdatedAt),
            detail.measured ?? true,
            this.convertOptionalDateTime(detail.observedSince)
        )
    }

    /**
     * Converts one internal component into the wire enum. Used to build a request, so an unknown value is a
     * programming error rather than a forward-compatibility case.
     */
    convertComponentToGrpc(component: CatalogStatisticsComponent): GrpcCatalogStatisticsComponent {
        switch (component) {
            case CatalogStatisticsComponent.Identity:
                return GrpcCatalogStatisticsComponent.COMPONENT_IDENTITY
            case CatalogStatisticsComponent.RecordCounts:
                return GrpcCatalogStatisticsComponent.COMPONENT_RECORD_COUNTS
            case CatalogStatisticsComponent.Collections:
                return GrpcCatalogStatisticsComponent.COMPONENT_COLLECTIONS
            case CatalogStatisticsComponent.Sessions:
                return GrpcCatalogStatisticsComponent.COMPONENT_SESSIONS
            case CatalogStatisticsComponent.CommitPipeline:
                return GrpcCatalogStatisticsComponent.COMPONENT_COMMIT_PIPELINE
            case CatalogStatisticsComponent.Activity:
                return GrpcCatalogStatisticsComponent.COMPONENT_ACTIVITY
            case CatalogStatisticsComponent.StorageSize:
                return GrpcCatalogStatisticsComponent.COMPONENT_STORAGE_SIZE
            case CatalogStatisticsComponent.StorageComposition:
                return GrpcCatalogStatisticsComponent.COMPONENT_STORAGE_COMPOSITION
            case CatalogStatisticsComponent.Fragmentation:
                return GrpcCatalogStatisticsComponent.COMPONENT_FRAGMENTATION
            case CatalogStatisticsComponent.History:
                return GrpcCatalogStatisticsComponent.COMPONENT_HISTORY
            case CatalogStatisticsComponent.Durability:
                return GrpcCatalogStatisticsComponent.COMPONENT_DURABILITY
            case CatalogStatisticsComponent.IndexSummary:
                return GrpcCatalogStatisticsComponent.COMPONENT_INDEX_SUMMARY
            case CatalogStatisticsComponent.IndexCardinality:
                return GrpcCatalogStatisticsComponent.COMPONENT_INDEX_CARDINALITY
            case CatalogStatisticsComponent.VolatileState:
                return GrpcCatalogStatisticsComponent.COMPONENT_VOLATILE_STATE
            default:
                throw new UnexpectedError(`Unsupported catalog statistics component '${component}'.`)
        }
    }

    convertIndexTypeToGrpc(indexType: EntityIndexType): GrpcEntityIndexType {
        switch (indexType) {
            case EntityIndexType.Global:
                return GrpcEntityIndexType.INDEX_TYPE_GLOBAL
            case EntityIndexType.ReferencedEntityType:
                return GrpcEntityIndexType.INDEX_TYPE_REFERENCED_ENTITY_TYPE
            case EntityIndexType.ReferencedEntity:
                return GrpcEntityIndexType.INDEX_TYPE_REFERENCED_ENTITY
            case EntityIndexType.ReferencedGroupEntityType:
                return GrpcEntityIndexType.INDEX_TYPE_REFERENCED_GROUP_ENTITY_TYPE
            case EntityIndexType.ReferencedGroupEntity:
                return GrpcEntityIndexType.INDEX_TYPE_REFERENCED_GROUP_ENTITY
            default:
                throw new UnexpectedError(`Unsupported entity index type '${indexType}'.`)
        }
    }

    convertOrderingToGrpc(ordering: IndexBrowseOrdering): GrpcIndexBrowseOrdering {
        switch (ordering) {
            case IndexBrowseOrdering.MapOrder:
                return GrpcIndexBrowseOrdering.INDEX_BROWSE_ORDERING_MAP_ORDER
            case IndexBrowseOrdering.EntityCount:
                return GrpcIndexBrowseOrdering.INDEX_BROWSE_ORDERING_ENTITY_COUNT
            case IndexBrowseOrdering.QueryCount:
                return GrpcIndexBrowseOrdering.INDEX_BROWSE_ORDERING_QUERY_COUNT
            case IndexBrowseOrdering.UpdateCount:
                return GrpcIndexBrowseOrdering.INDEX_BROWSE_ORDERING_UPDATE_COUNT
            default:
                throw new UnexpectedError(`Unsupported index browse ordering '${ordering}'.`)
        }
    }

    convertOrderDirectionToGrpc(direction: OrderDirection): GrpcOrderDirection {
        return direction === OrderDirection.Desc ? GrpcOrderDirection.DESC : GrpcOrderDirection.ASC
    }

    private convertIdentity(identity: GrpcCatalogIdentity | undefined): CatalogIdentity {
        if (identity == undefined) {
            // the contract states identity is always present; a snapshot without one cannot be interpreted at all
            throw new UnexpectedError('Missing catalog identity in a catalog statistics snapshot.')
        }
        return new CatalogIdentity(
            identity.catalogId != undefined
                ? EvitaValueConverter.convertGrpcUuid(identity.catalogId)
                : undefined,
            identity.catalogName,
            this.catalogStatisticsConverterProvider().convertCatalogState(identity.catalogState),
            BigInt(identity.catalogVersion),
            identity.readOnly,
            identity.unusable,
            identity.transactional,
            identity.goingLive,
            identity.entityCollectionCount
        )
    }

    private convertComponentStatuses(
        statuses: GrpcComponentStatus[]
    ): ImmutableMap<CatalogStatisticsComponent, ComponentStatus> {
        let result: ImmutableMap<CatalogStatisticsComponent, ComponentStatus> = ImmutableMap()
        for (const status of statuses) {
            const component: CatalogStatisticsComponent | undefined = this.convertComponent(status.component)
            if (component == undefined) {
                // forward-compatibility: a newer server may report a component this client does not know yet
                continue
            }
            result = result.set(
                component,
                new ComponentStatus(component, this.convertAvailability(status.availability), status.reason)
            )
        }
        return result
    }

    private convertComponent(component: GrpcCatalogStatisticsComponent): CatalogStatisticsComponent | undefined {
        switch (component) {
            case GrpcCatalogStatisticsComponent.COMPONENT_IDENTITY:
                return CatalogStatisticsComponent.Identity
            case GrpcCatalogStatisticsComponent.COMPONENT_RECORD_COUNTS:
                return CatalogStatisticsComponent.RecordCounts
            case GrpcCatalogStatisticsComponent.COMPONENT_COLLECTIONS:
                return CatalogStatisticsComponent.Collections
            case GrpcCatalogStatisticsComponent.COMPONENT_SESSIONS:
                return CatalogStatisticsComponent.Sessions
            case GrpcCatalogStatisticsComponent.COMPONENT_COMMIT_PIPELINE:
                return CatalogStatisticsComponent.CommitPipeline
            case GrpcCatalogStatisticsComponent.COMPONENT_ACTIVITY:
                return CatalogStatisticsComponent.Activity
            case GrpcCatalogStatisticsComponent.COMPONENT_STORAGE_SIZE:
                return CatalogStatisticsComponent.StorageSize
            case GrpcCatalogStatisticsComponent.COMPONENT_STORAGE_COMPOSITION:
                return CatalogStatisticsComponent.StorageComposition
            case GrpcCatalogStatisticsComponent.COMPONENT_FRAGMENTATION:
                return CatalogStatisticsComponent.Fragmentation
            case GrpcCatalogStatisticsComponent.COMPONENT_HISTORY:
                return CatalogStatisticsComponent.History
            case GrpcCatalogStatisticsComponent.COMPONENT_DURABILITY:
                return CatalogStatisticsComponent.Durability
            case GrpcCatalogStatisticsComponent.COMPONENT_INDEX_SUMMARY:
                return CatalogStatisticsComponent.IndexSummary
            case GrpcCatalogStatisticsComponent.COMPONENT_INDEX_CARDINALITY:
                return CatalogStatisticsComponent.IndexCardinality
            case GrpcCatalogStatisticsComponent.COMPONENT_VOLATILE_STATE:
                return CatalogStatisticsComponent.VolatileState
            default:
                console.warn(`Unsupported catalog statistics component '${component}', ignoring its status.`)
                return undefined
        }
    }

    private convertAvailability(availability: GrpcComponentAvailability): ComponentAvailability {
        switch (availability) {
            case GrpcComponentAvailability.AVAILABILITY_DELIVERED:
                return ComponentAvailability.Delivered
            case GrpcComponentAvailability.AVAILABILITY_CATALOG_UNUSABLE:
                return ComponentAvailability.CatalogUnusable
            case GrpcComponentAvailability.AVAILABILITY_FEATURE_DISABLED:
                return ComponentAvailability.FeatureDisabled
            default:
                // never treat an unknown availability as delivered - the sub-message may well be absent
                return ComponentAvailability.Unknown
        }
    }

    private convertRecordCounts(counts: GrpcRecordCounts): RecordCounts {
        return new RecordCounts(
            BigInt(counts.totalRecords),
            BigInt(counts.liveRecords),
            BigInt(counts.archivedRecords)
        )
    }

    private convertSessions(sessions: GrpcSessionStatistics): SessionStatistics {
        return new SessionStatistics(
            sessions.activeSessions,
            sessions.activeReadOnlySessions,
            sessions.activeReadWriteSessions
        )
    }

    private convertCommitPipeline(pipeline: GrpcCommitPipelineStatistics): CommitPipelineStatistics {
        return new CommitPipelineStatistics(
            BigInt(pipeline.lastAssignedCatalogVersion),
            BigInt(pipeline.lastWrittenCatalogVersion),
            BigInt(pipeline.lastDurableCatalogVersion),
            BigInt(pipeline.lastFinalizedCatalogVersion)
        )
    }

    private convertActivity(activity: GrpcActivityStatistics): ActivityStatistics {
        return new ActivityStatistics(
            BigInt(activity.transactionsCommitted),
            BigInt(activity.transactionsRolledBack),
            BigInt(activity.transactionsConflicted),
            BigInt(activity.mutationsApplied),
            BigInt(activity.walBytesAppended),
            BigInt(activity.pipelineDepth),
            activity.transactionsPerSecond,
            activity.mutationsPerSecond,
            activity.walBytesPerSecond,
            this.convertOptionalDateTime(activity.countingSince)
        )
    }

    private convertStorageSize(size: GrpcStorageSizeStatistics): StorageSizeStatistics {
        return new StorageSizeStatistics(
            BigInt(size.sizeOnDiskInBytes),
            BigInt(size.liveBytes),
            BigInt(size.wasteBytes),
            BigInt(size.walBytes),
            BigInt(size.awaitingDeletionBytes),
            BigInt(size.blockedByActiveReaderBytes),
            BigInt(size.purgeableBytes),
            BigInt(size.bootstrapBytes),
            BigInt(size.unaccountedBytes),
            BigInt(size.catalogDataStoreLiveBytes),
            BigInt(size.catalogDataStoreWasteBytes)
        )
    }

    private convertStoragePartUsages(parts: GrpcStoragePartUsage[]): ImmutableList<StoragePartUsage> {
        return ImmutableList(
            parts.map(it => {
                const group: StoragePartGroup | undefined = this.convertStoragePartGroup(it.group)
                return new StoragePartUsage(
                    it.storagePartType,
                    it.count,
                    BigInt(it.totalBytes),
                    group,
                    // the kind is derived from the group whenever the group is known, so the two can never
                    // disagree; the wire kind is the fallback that keeps a newer server's row classified
                    group != undefined ? storagePartKindOf(group) : this.convertStoragePartKind(it.kind)
                )
            })
        )
    }

    private convertStoragePartGroup(group: GrpcStoragePartGroup): StoragePartGroup | undefined {
        switch (group) {
            case GrpcStoragePartGroup.STORAGE_PART_GROUP_ENTITY_BODY:
                return StoragePartGroup.EntityBody
            case GrpcStoragePartGroup.STORAGE_PART_GROUP_ATTRIBUTE_DATA:
                return StoragePartGroup.AttributeData
            case GrpcStoragePartGroup.STORAGE_PART_GROUP_ASSOCIATED_DATA:
                return StoragePartGroup.AssociatedData
            case GrpcStoragePartGroup.STORAGE_PART_GROUP_PRICE_DATA:
                return StoragePartGroup.PriceData
            case GrpcStoragePartGroup.STORAGE_PART_GROUP_REFERENCE_DATA:
                return StoragePartGroup.ReferenceData
            case GrpcStoragePartGroup.STORAGE_PART_GROUP_INDEX_MANIFEST:
                return StoragePartGroup.IndexManifest
            case GrpcStoragePartGroup.STORAGE_PART_GROUP_ATTRIBUTE_INDEX:
                return StoragePartGroup.AttributeIndex
            case GrpcStoragePartGroup.STORAGE_PART_GROUP_PRICE_INDEX:
                return StoragePartGroup.PriceIndex
            case GrpcStoragePartGroup.STORAGE_PART_GROUP_REFERENCE_INDEX:
                return StoragePartGroup.ReferenceIndex
            case GrpcStoragePartGroup.STORAGE_PART_GROUP_FACET_INDEX:
                return StoragePartGroup.FacetIndex
            case GrpcStoragePartGroup.STORAGE_PART_GROUP_HIERARCHY_INDEX:
                return StoragePartGroup.HierarchyIndex
            case GrpcStoragePartGroup.STORAGE_PART_GROUP_REFERENCE_HISTOGRAM_INDEX:
                return StoragePartGroup.ReferenceHistogramIndex
            case GrpcStoragePartGroup.STORAGE_PART_GROUP_SCHEMA:
                return StoragePartGroup.Schema
            case GrpcStoragePartGroup.STORAGE_PART_GROUP_HEADER:
                return StoragePartGroup.Header
            default:
                return undefined
        }
    }

    private convertStoragePartKind(kind: GrpcStoragePartKind): StoragePartKind | undefined {
        switch (kind) {
            case GrpcStoragePartKind.STORAGE_PART_KIND_ENTITY_DATA:
                return StoragePartKind.EntityData
            case GrpcStoragePartKind.STORAGE_PART_KIND_INDEX:
                return StoragePartKind.Index
            case GrpcStoragePartKind.STORAGE_PART_KIND_METADATA:
                return StoragePartKind.Metadata
            default:
                return undefined
        }
    }

    private convertStorageComposition(
        composition: GrpcStorageCompositionStatistics
    ): StorageCompositionStatistics {
        return new StorageCompositionStatistics(this.convertStoragePartUsages(composition.catalogParts))
    }

    private convertDataStoreFragmentation(fragmentation: GrpcDataStoreFragmentation): DataStoreFragmentation {
        return new DataStoreFragmentation(
            fragmentation.activeRecordShare,
            BigInt(fragmentation.liveBytes),
            BigInt(fragmentation.wasteBytes),
            fragmentation.compactionEligibleNow,
            BigInt(fragmentation.wasteBytesGenerated),
            fragmentation.wasteAccumulationRateBytesPerSecond,
            this.convertOptionalDateTime(fragmentation.estimatedCompactionAt)
        )
    }

    private convertFragmentation(fragmentation: GrpcFragmentationStatistics): FragmentationStatistics {
        return new FragmentationStatistics(
            fragmentation.activeRecordShare,
            BigInt(fragmentation.liveBytes),
            BigInt(fragmentation.wasteBytes),
            fragmentation.compactionEligibleNow,
            BigInt(fragmentation.fileSizeCompactionThresholdBytes),
            BigInt(fragmentation.wasteBytesGenerated),
            fragmentation.wasteAccumulationRateBytesPerSecond,
            this.convertOptionalDateTime(fragmentation.estimatedCompactionAt),
            fragmentation.minimalActiveRecordShare,
            fragmentation.maxWasteActiveShare,
            BigInt(fragmentation.minCompactionIntervalMilliseconds),
            fragmentation.catalogDataStore != undefined
                ? this.convertDataStoreFragmentation(fragmentation.catalogDataStore)
                : undefined
        )
    }

    private convertHistory(history: GrpcHistoryStatistics): HistoryStatistics {
        return new HistoryStatistics(
            history.timeTravelEnabled,
            BigInt(history.oldestAvailableCatalogVersion),
            this.convertOptionalDateTime(history.oldestAvailableTimestamp),
            BigInt(history.newestCatalogVersion),
            this.convertOptionalDateTime(history.newestTimestamp),
            history.walFileCount,
            BigInt(history.walBytes),
            BigInt(history.activeReaderFloor),
            history.awaitingDeletionFileCount,
            BigInt(history.awaitingDeletionBytes),
            BigInt(history.blockedByActiveReaderBytes),
            BigInt(history.purgeableBytes)
        )
    }

    private convertIndexSummary(summary: GrpcIndexSummaryStatistics): IndexSummaryStatistics {
        return new IndexSummaryStatistics(BigInt(summary.totalIndexCount))
    }

    private convertDataStoreVolatileState(state: GrpcDataStoreVolatileState): DataStoreVolatileState {
        return new DataStoreVolatileState(
            BigInt(state.totalSizeIncludingVolatileDataBytes),
            state.nonFlushedRecordCount,
            BigInt(state.nonFlushedSizeBytes),
            this.convertOptionalDateTime(state.oldestRecordKeptTimestamp)
        )
    }

    private convertVolatileState(state: GrpcVolatileStateStatistics): VolatileStateStatistics {
        return new VolatileStateStatistics(
            BigInt(state.totalSizeIncludingVolatileDataBytes),
            state.nonFlushedRecordCount,
            BigInt(state.nonFlushedSizeBytes),
            this.convertOptionalDateTime(state.oldestRecordKeptTimestamp),
            state.catalogDataStore != undefined
                ? this.convertDataStoreVolatileState(state.catalogDataStore)
                : undefined
        )
    }

    private convertDurability(durability: GrpcDurabilityStatistics): DurabilityStatistics {
        return new DurabilityStatistics(
            BigInt(durability.checkpointIntervalMillis),
            BigInt(durability.lastCadenceMillis),
            BigInt(durability.lastFenceDepthMillis),
            durability.lastFilesForced,
            BigInt(durability.lastForceDurationMillis),
            BigInt(durability.checkpointsCompleted),
            this.convertOptionalDateTime(durability.lastCheckpointAt),
            this.convertOptionalDateTime(durability.countingSince)
        )
    }

    private convertCatalogIndexCardinality(cardinality: GrpcCatalogIndexCardinality): CatalogIndexCardinality {
        return new CatalogIndexCardinality(
            ImmutableList(
                cardinality.globalUniqueIndexes.map((it: GrpcGlobalUniqueIndexCardinality) =>
                    new GlobalUniqueIndexCardinality(
                        it.attributeName,
                        it.locale != undefined ? EvitaValueConverter.convertGrpcLocale(it.locale) : undefined,
                        ScopesConverter.convertEntityScope(it.scope),
                        it.distinctValueCount
                    ))
            )
        )
    }

    private convertCollectionHeader(header: GrpcCollectionHeaderInfo): CollectionHeaderInfo {
        return new CollectionHeaderInfo(
            header.entityTypePrimaryKey,
            BigInt(header.version),
            header.lastPrimaryKey,
            header.lastEntityIndexPrimaryKey,
            header.lastInternalPriceId,
            BigInt(header.lastKeyId),
            BigInt(header.maxRecordSizeBytes),
            this.convertOptionalDateTime(header.lastModified)
        )
    }

    private convertCollectionRecordCounts(counts: GrpcCollectionRecordCounts): CollectionRecordCounts {
        return new CollectionRecordCounts(counts.totalRecords, counts.liveRecords, counts.archivedRecords)
    }

    private convertCollectionStorageSize(size: GrpcCollectionStorageSize): CollectionStorageSize {
        return new CollectionStorageSize(
            BigInt(size.sizeOnDiskInBytes),
            BigInt(size.liveBytes),
            BigInt(size.wasteBytes),
            BigInt(size.awaitingDeletionBytes),
            BigInt(size.unaccountedBytes)
        )
    }

    private convertCollectionStorageComposition(
        composition: GrpcCollectionStorageComposition
    ): CollectionStorageComposition {
        return new CollectionStorageComposition(this.convertStoragePartUsages(composition.parts))
    }

    private convertCollectionIndexSummary(summary: GrpcCollectionIndexSummary): CollectionIndexSummary {
        const counts: IndexTypeCount[] = []
        for (const count of summary.byTypeAndScope as GrpcIndexTypeCount[]) {
            const indexType: EntityIndexType | undefined = this.convertIndexType(count.indexType)
            if (indexType == undefined) {
                continue
            }
            counts.push(new IndexTypeCount(indexType, ScopesConverter.convertEntityScope(count.scope), count.count))
        }
        return new CollectionIndexSummary(summary.totalIndexCount, ImmutableList(counts))
    }

    private convertIndexCardinality(cardinality: GrpcIndexCardinality): IndexCardinality {
        return new IndexCardinality(
            cardinality.indexType != undefined ? this.convertIndexType(cardinality.indexType) : undefined,
            ScopesConverter.convertEntityScope(cardinality.scope),
            cardinality.discriminator,
            cardinality.entityCount,
            cardinality.referencedEntityCount,
            ImmutableList(
                cardinality.attributes.map((it: GrpcAttributeCardinality) => new AttributeCardinality(
                    it.attributeName,
                    it.referenceName,
                    it.locale != undefined ? EvitaValueConverter.convertGrpcLocale(it.locale) : undefined,
                    this.convertAttributeIndexType(it.indexType),
                    it.distinctValueCount,
                    it.recordsCovered
                ))
            )
        )
    }

    private convertCollectionIndexCardinality(
        cardinality: GrpcCollectionIndexCardinality
    ): CollectionIndexCardinality {
        return new CollectionIndexCardinality(
            ImmutableList(cardinality.indexes.map(it => this.convertIndexCardinality(it))),
            cardinality.omittedIndexCount
        )
    }

    private convertBrowsedIndex(index: GrpcBrowsedIndex): BrowsedIndex {
        return new BrowsedIndex(
            index.indexType != undefined ? this.convertIndexType(index.indexType) : undefined,
            ScopesConverter.convertEntityScope(index.scope),
            index.referenceName,
            index.discriminatorPrimaryKey,
            index.entityCount,
            index.discriminator,
            index.indexPrimaryKey,
            index.entityType,
            BigInt(index.queryCount),
            BigInt(index.updateCount),
            this.convertOptionalDateTime(index.lastQueriedAt),
            this.convertOptionalDateTime(index.lastUpdatedAt),
            // a server predating the flag always measured, so silence decodes as "measured"
            index.measured ?? true,
            this.convertOptionalDateTime(index.observedSince)
        )
    }

    private convertIndexType(indexType: GrpcEntityIndexType): EntityIndexType | undefined {
        switch (indexType) {
            case GrpcEntityIndexType.INDEX_TYPE_GLOBAL:
                return EntityIndexType.Global
            case GrpcEntityIndexType.INDEX_TYPE_REFERENCED_ENTITY_TYPE:
                return EntityIndexType.ReferencedEntityType
            case GrpcEntityIndexType.INDEX_TYPE_REFERENCED_ENTITY:
                return EntityIndexType.ReferencedEntity
            case GrpcEntityIndexType.INDEX_TYPE_REFERENCED_GROUP_ENTITY_TYPE:
                return EntityIndexType.ReferencedGroupEntityType
            case GrpcEntityIndexType.INDEX_TYPE_REFERENCED_GROUP_ENTITY:
                return EntityIndexType.ReferencedGroupEntity
            default:
                console.warn(`Unsupported entity index type '${indexType}', reporting it as unknown.`)
                return undefined
        }
    }

    private convertAttributeIndexType(indexType: GrpcAttributeIndexType): AttributeIndexType {
        switch (indexType) {
            case GrpcAttributeIndexType.ATTRIBUTE_INDEX_TYPE_UNIQUE:
                return AttributeIndexType.Unique
            case GrpcAttributeIndexType.ATTRIBUTE_INDEX_TYPE_FILTER:
                return AttributeIndexType.Filter
            case GrpcAttributeIndexType.ATTRIBUTE_INDEX_TYPE_SORT:
                return AttributeIndexType.Sort
            default:
                throw new UnexpectedError(`Unsupported attribute index type '${indexType}'.`)
        }
    }

    private convertOptionalDateTime(dateTime: GrpcOffsetDateTime | undefined): OffsetDateTime | undefined {
        return dateTime != undefined ? EvitaValueConverter.convertGrpcOffsetDateTime(dateTime) : undefined
    }
}
