import { test, expect } from 'vitest'
import { StoragePartUsage } from '../../../src/modules/database-driver/request-response/statistics/StoragePartUsage'
import {
    StoragePartGroup
} from '../../../src/modules/database-driver/request-response/statistics/StoragePartGroup'
import {
    StoragePartKind,
    storagePartKindOf
} from '../../../src/modules/database-driver/request-response/statistics/StoragePartKind'
import type {
    StorageBucketRow,
    StorageComposition,
    StorageGroupRow
} from '../../../src/modules/catalog-viewer/model/storageComposition'
import { StorageBucket } from '../../../src/modules/catalog-viewer/model/storageComposition'
import { summarizeStorageComposition } from '../../../src/modules/catalog-viewer/service/storageComposition'

/**
 * The `Product` collection of the fixture measured in `161-storage-composition-parts-analysis.md`, with the
 * classification the server now sends. The byte totals the buckets have to reproduce are recorded there.
 */
function productParts(): StoragePartUsage[] {
    const parts: [string, number, bigint, StoragePartGroup][] = [
        ['AssociatedDataStoragePart', 180, 28063n, StoragePartGroup.AssociatedData],
        ['FilterIndexStoragePart', 98, 19052n, StoragePartGroup.AttributeIndex],
        ['AttributesStoragePart', 180, 14630n, StoragePartGroup.AttributeData],
        ['SortIndexStoragePart', 70, 9658n, StoragePartGroup.AttributeIndex],
        ['PriceListAndCurrencyRefIndexStoragePart', 52, 6861n, StoragePartGroup.PriceIndex],
        ['PricesStoragePart', 60, 6318n, StoragePartGroup.PriceData],
        ['ReferencesStoragePart', 60, 4721n, StoragePartGroup.ReferenceData],
        ['PriceListAndCurrencySuperIndexStoragePart', 4, 3644n, StoragePartGroup.PriceIndex],
        ['EntityBodyStoragePart', 60, 3480n, StoragePartGroup.EntityBody],
        ['EntityIndexStoragePart', 16, 2129n, StoragePartGroup.IndexManifest],
        ['FacetIndexStoragePart', 28, 2002n, StoragePartGroup.FacetIndex],
        ['EntityIdsStoragePart', 16, 1521n, StoragePartGroup.IndexManifest],
        ['EntitySchemaStoragePart', 1, 701n, StoragePartGroup.Schema],
        ['UniqueIndexStoragePart', 14, 583n, StoragePartGroup.AttributeIndex],
        ['ReferenceTypeCardinalityIndexStoragePart', 2, 289n, StoragePartGroup.ReferenceIndex]
    ]
    return parts.map(([type, count, bytes, group]: [string, number, bigint, StoragePartGroup]) =>
        new StoragePartUsage(type, count, bytes, group, storagePartKindOf(group)))
}

function bucketOf(composition: StorageComposition, bucket: StorageBucket): StorageBucketRow {
    const row: StorageBucketRow | undefined = composition.buckets.find(it => it.bucket === bucket)
    expect(row, `bucket ${bucket} is missing`).toBeDefined()
    return row!
}

test('Should sum every index structure into the Indexes bucket rather than pick a representative row', () => {
    const composition: StorageComposition = summarizeStorageComposition(productParts())

    // 45 739 B of index structures, against the 2 129 B of the index manifest alone
    expect(bucketOf(composition, StorageBucket.Indexes).totalBytes).toBe(45739n)
    expect(bucketOf(composition, StorageBucket.Indexes).count).toBe(300)
    expect(composition.totalBytes).toBe(103652n)
})

test('Should reproduce the documented seven buckets and nothing else', () => {
    const composition: StorageComposition = summarizeStorageComposition(productParts())

    expect(composition.buckets.map(it => it.bucket)).toEqual([
        StorageBucket.EntityBodies,
        StorageBucket.Attributes,
        StorageBucket.References,
        StorageBucket.Prices,
        StorageBucket.AssociatedData,
        StorageBucket.Indexes,
        StorageBucket.Metadata
    ])
    expect(bucketOf(composition, StorageBucket.AssociatedData).totalBytes).toBe(28063n)
    expect(bucketOf(composition, StorageBucket.Metadata).totalBytes).toBe(701n)
})

test('Should split the Indexes bucket into the groups a schema owner can act on', () => {
    const indexes: StorageBucketRow = bucketOf(
        summarizeStorageComposition(productParts()),
        StorageBucket.Indexes
    )

    const attributeIndex: StorageGroupRow | undefined = indexes.groups
        .find(it => it.key === StoragePartGroup.AttributeIndex)
    expect(attributeIndex?.totalBytes).toBe(29293n)
    // the three attribute structures are summed, and the class names stay visible on the row
    expect(attributeIndex?.partTypes).toEqual([
        'FilterIndexStoragePart',
        'SortIndexStoragePart',
        'UniqueIndexStoragePart'
    ])
    // biggest group first
    expect(indexes.groups.map(it => it.key)).toEqual([
        StoragePartGroup.AttributeIndex,
        StoragePartGroup.PriceIndex,
        StoragePartGroup.IndexManifest,
        StoragePartGroup.FacetIndex,
        StoragePartGroup.ReferenceIndex
    ])
})

test('Should keep a single-group bucket unexpandable, with its own part types on the row', () => {
    const attributes: StorageBucketRow = bucketOf(
        summarizeStorageComposition(productParts()),
        StorageBucket.Attributes
    )

    expect(attributes.groups).toHaveLength(1)
    expect(attributes.groups[0]!.partTypes).toEqual(['AttributesStoragePart'])
    expect(attributes.averageBytes).toBeCloseTo(14630 / 180)
})

test('Should classify a group this build does not know by its coarse kind', () => {
    const composition: StorageComposition = summarizeStorageComposition([
        new StoragePartUsage('SomeFutureIndexStoragePart', 4, 1000n, undefined, StoragePartKind.Index),
        new StoragePartUsage('SomeFutureEntityPart', 2, 500n, undefined, StoragePartKind.EntityData)
    ])

    expect(bucketOf(composition, StorageBucket.Indexes).totalBytes).toBe(1000n)
    expect(bucketOf(composition, StorageBucket.OtherEntityData).totalBytes).toBe(500n)
})

test('Should report an unclassified row as unclassified instead of folding it into indexes', () => {
    const composition: StorageComposition = summarizeStorageComposition([
        new StoragePartUsage('EntityBodyStoragePart', 1, 100n, StoragePartGroup.EntityBody, StoragePartKind.EntityData),
        new StoragePartUsage('MysteryPart', 1, 42n, undefined, undefined)
    ])

    expect(composition.buckets.map(it => it.bucket)).toEqual([
        StorageBucket.EntityBodies,
        StorageBucket.Unclassified
    ])
    expect(bucketOf(composition, StorageBucket.Unclassified).totalBytes).toBe(42n)
})

test('Should derive the kind of every group the server can send', () => {
    const kinds: Record<StoragePartKind, StoragePartGroup[]> = {
        [StoragePartKind.EntityData]: [
            StoragePartGroup.EntityBody,
            StoragePartGroup.AttributeData,
            StoragePartGroup.AssociatedData,
            StoragePartGroup.PriceData,
            StoragePartGroup.ReferenceData
        ],
        [StoragePartKind.Index]: [
            StoragePartGroup.IndexManifest,
            StoragePartGroup.AttributeIndex,
            StoragePartGroup.PriceIndex,
            StoragePartGroup.ReferenceIndex,
            StoragePartGroup.FacetIndex,
            StoragePartGroup.HierarchyIndex,
            StoragePartGroup.ReferenceHistogramIndex
        ],
        [StoragePartKind.Metadata]: [
            StoragePartGroup.Schema,
            StoragePartGroup.Header
        ]
    }

    // every value of the closed set is classified, and classified exactly once
    expect(Object.values(kinds).flat()).toHaveLength(Object.values(StoragePartGroup).length)
    for (const [kind, groups] of Object.entries(kinds)) {
        for (const group of groups) {
            expect(storagePartKindOf(group)).toBe(kind)
        }
    }
})
