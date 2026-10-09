import { expect, test } from 'vitest'
import {
    CatalogStatisticsSnapshotConverter
} from '@/modules/database-driver/connector/grpc/service/converter/CatalogStatisticsSnapshotConverter'
import {
    CatalogStatisticsConverter
} from '@/modules/database-driver/connector/grpc/service/converter/CatalogStatisticsConverter'
import type {
    GrpcBrowsedIndex,
    GrpcCatalogIdentity,
    GrpcCatalogStatisticsSnapshot,
    GrpcComponentStatus,
    GrpcStoragePartUsage
} from '@/modules/database-driver/connector/grpc/gen/GrpcStatistics_pb'
import type { GrpcIndexBrowseResponse } from '@/modules/database-driver/connector/grpc/gen/GrpcEvitaManagementAPI_pb'
import {
    GrpcCatalogState,
    GrpcCatalogStatisticsComponent,
    GrpcComponentAvailability,
    GrpcEntityScope,
    GrpcStoragePartGroup,
    GrpcStoragePartKind
} from '@/modules/database-driver/connector/grpc/gen/GrpcEnums_pb'
import { CatalogStatisticsSnapshot } from '@/modules/database-driver/request-response/statistics/CatalogStatisticsSnapshot'
import {
    CatalogStatisticsComponent
} from '@/modules/database-driver/request-response/statistics/CatalogStatisticsComponent'
import { ComponentAvailability } from '@/modules/database-driver/request-response/statistics/ComponentAvailability'
import { StoragePartGroup } from '@/modules/database-driver/request-response/statistics/StoragePartGroup'
import { StoragePartKind } from '@/modules/database-driver/request-response/statistics/StoragePartKind'
import { StoragePartUsage } from '@/modules/database-driver/request-response/statistics/StoragePartUsage'
import { BrowsedIndex } from '@/modules/database-driver/request-response/statistics/BrowsedIndex'
import { BrowsedIndexPage } from '@/modules/database-driver/request-response/statistics/BrowsedIndexPage'

/**
 * Pins the conversion rules the documentation calls load-bearing: an absent optional field is `undefined` and never
 * `0`, an absent `measured` flag is `true`, the storage-part kind is derived from a known group and read from the
 * wire only for an unknown one, an unrecognised availability is `Unknown` rather than `Delivered`, and the `-1`
 * sentinels of an unusable catalog stay in the model behind the `known*` accessors.
 */

const converter: CatalogStatisticsSnapshotConverter = new CatalogStatisticsSnapshotConverter(
    () => new CatalogStatisticsConverter()
)

function grpcIdentity(overrides: Partial<GrpcCatalogIdentity> = {}): GrpcCatalogIdentity {
    return {
        catalogName: 'evita',
        catalogState: GrpcCatalogState.ALIVE,
        catalogVersion: '42',
        readOnly: false,
        unusable: false,
        transactional: true,
        goingLive: false,
        entityCollectionCount: 3,
        ...overrides
    } as unknown as GrpcCatalogIdentity
}

function grpcSnapshot(overrides: Partial<GrpcCatalogStatisticsSnapshot> = {}): GrpcCatalogStatisticsSnapshot {
    return {
        identity: grpcIdentity(),
        componentStatus: [],
        ...overrides
    } as unknown as GrpcCatalogStatisticsSnapshot
}

function grpcStatus(
    component: GrpcCatalogStatisticsComponent,
    availability: GrpcComponentAvailability,
    reason?: string
): GrpcComponentStatus {
    return { component, availability, reason } as unknown as GrpcComponentStatus
}

function grpcPart(group: GrpcStoragePartGroup, kind: GrpcStoragePartKind): GrpcStoragePartUsage {
    return {
        storagePartType: 'SomeStoragePart',
        count: 2,
        totalBytes: '1024',
        group,
        kind
    } as unknown as GrpcStoragePartUsage
}

function grpcBrowsedIndex(overrides: Partial<GrpcBrowsedIndex> = {}): GrpcBrowsedIndex {
    return {
        scope: GrpcEntityScope.SCOPE_LIVE,
        indexPrimaryKey: 7,
        queryCount: '12',
        updateCount: '3',
        ...overrides
    } as unknown as GrpcBrowsedIndex
}

function browse(index: GrpcBrowsedIndex): BrowsedIndex {
    const page: BrowsedIndexPage = converter.convertIndexBrowsePage({
        catalogVersion: '42',
        pageNumber: 1,
        pageSize: 20,
        totalRecordCount: 1,
        indexes: [index]
    } as unknown as GrpcIndexBrowseResponse)
    const browsed: BrowsedIndex | undefined = page.data.first()
    if (browsed == undefined) {
        throw new Error('The page should carry the one index given.')
    }
    return browsed
}

function parts(snapshot: CatalogStatisticsSnapshot): StoragePartUsage[] {
    return snapshot.storageComposition?.catalogParts.toArray() ?? []
}

test('Should keep an absent entity count undefined instead of reading it as zero', () => {
    expect(browse(grpcBrowsedIndex()).entityCount).toBeUndefined()
    expect(browse(grpcBrowsedIndex({ entityCount: 0 })).entityCount).toBe(0)
})

test('Should decode an absent measured flag as measured', () => {
    expect(browse(grpcBrowsedIndex()).measured).toBe(true)
    expect(browse(grpcBrowsedIndex({ measured: false })).measured).toBe(false)
})

test('Should derive the storage-part kind from a known group even when the wire kind disagrees', () => {
    const snapshot: CatalogStatisticsSnapshot = converter.convertCatalogSnapshot(grpcSnapshot({
        storageComposition: {
            catalogParts: [
                grpcPart(GrpcStoragePartGroup.STORAGE_PART_GROUP_ATTRIBUTE_INDEX, GrpcStoragePartKind.STORAGE_PART_KIND_METADATA)
            ]
        } as unknown as GrpcCatalogStatisticsSnapshot['storageComposition']
    }))

    const part: StoragePartUsage | undefined = parts(snapshot)[0]
    expect(part?.group).toBe(StoragePartGroup.AttributeIndex)
    expect(part?.kind).toBe(StoragePartKind.Index)
})

test('Should fall back to the wire kind for a group this build does not know', () => {
    const snapshot: CatalogStatisticsSnapshot = converter.convertCatalogSnapshot(grpcSnapshot({
        storageComposition: {
            catalogParts: [grpcPart(999 as GrpcStoragePartGroup, GrpcStoragePartKind.STORAGE_PART_KIND_INDEX)]
        } as unknown as GrpcCatalogStatisticsSnapshot['storageComposition']
    }))

    const part: StoragePartUsage | undefined = parts(snapshot)[0]
    expect(part?.group).toBeUndefined()
    expect(part?.kind).toBe(StoragePartKind.Index)
})

test('Should leave a row the server did not classify unclassified rather than defaulted', () => {
    const snapshot: CatalogStatisticsSnapshot = converter.convertCatalogSnapshot(grpcSnapshot({
        storageComposition: {
            catalogParts: [
                grpcPart(GrpcStoragePartGroup.STORAGE_PART_GROUP_UNSPECIFIED, GrpcStoragePartKind.STORAGE_PART_KIND_UNSPECIFIED)
            ]
        } as unknown as GrpcCatalogStatisticsSnapshot['storageComposition']
    }))

    const part: StoragePartUsage | undefined = parts(snapshot)[0]
    expect(part?.group).toBeUndefined()
    expect(part?.kind).toBeUndefined()
})

test('Should answer undefined for a component the request never named', () => {
    const snapshot: CatalogStatisticsSnapshot = converter.convertCatalogSnapshot(grpcSnapshot({
        componentStatus: [
            grpcStatus(GrpcCatalogStatisticsComponent.COMPONENT_ACTIVITY, GrpcComponentAvailability.AVAILABILITY_DELIVERED)
        ]
    }))

    expect(snapshot.statusOf(CatalogStatisticsComponent.Activity)?.availability).toBe(ComponentAvailability.Delivered)
    expect(snapshot.statusOf(CatalogStatisticsComponent.History)).toBeUndefined()
})

test('Should convert an unrecognised availability to unknown, never to delivered', () => {
    const snapshot: CatalogStatisticsSnapshot = converter.convertCatalogSnapshot(grpcSnapshot({
        componentStatus: [
            grpcStatus(GrpcCatalogStatisticsComponent.COMPONENT_HISTORY, GrpcComponentAvailability.AVAILABILITY_UNSPECIFIED),
            grpcStatus(
                GrpcCatalogStatisticsComponent.COMPONENT_ACTIVITY,
                GrpcComponentAvailability.AVAILABILITY_FEATURE_DISABLED,
                'disabled by the operator'
            )
        ]
    }))

    expect(snapshot.statusOf(CatalogStatisticsComponent.History)?.availability).toBe(ComponentAvailability.Unknown)
    expect(snapshot.statusOf(CatalogStatisticsComponent.Activity)?.availability)
        .toBe(ComponentAvailability.FeatureDisabled)
    expect(snapshot.statusOf(CatalogStatisticsComponent.Activity)?.reason).toBe('disabled by the operator')
})

test('Should keep the unusable-catalog sentinels in the model and hide them behind the known accessors', () => {
    const snapshot: CatalogStatisticsSnapshot = converter.convertCatalogSnapshot(grpcSnapshot({
        identity: grpcIdentity({ unusable: true, catalogVersion: '-1', entityCollectionCount: -1 })
    }))

    expect(snapshot.identity.catalogVersion).toBe(-1n)
    expect(snapshot.identity.entityCollectionCount).toBe(-1)
    expect(snapshot.identity.knownCatalogVersion).toBeUndefined()
    expect(snapshot.identity.knownEntityCollectionCount).toBeUndefined()
})

test('Should expose the version and collection count of a usable catalog through the same accessors', () => {
    const snapshot: CatalogStatisticsSnapshot = converter.convertCatalogSnapshot(grpcSnapshot())

    expect(snapshot.identity.knownCatalogVersion).toBe(42n)
    expect(snapshot.identity.knownEntityCollectionCount).toBe(3)
})
