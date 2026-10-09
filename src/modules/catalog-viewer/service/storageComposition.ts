import { StoragePartUsage } from '@/modules/database-driver/request-response/statistics/StoragePartUsage'
import { StoragePartGroup } from '@/modules/database-driver/request-response/statistics/StoragePartGroup'
import { StoragePartKind } from '@/modules/database-driver/request-response/statistics/StoragePartKind'
import { share } from '@/modules/catalog-viewer/service/statisticsFormatting'
import type {
    StorageBucketRow,
    StorageComposition,
    StorageGroupRow
} from '@/modules/catalog-viewer/model/storageComposition'
import {
    canonicalStorageBuckets,
    entityDataBuckets,
    StorageBucket,
    storageBucketColor,
    storageBucketHelp,
    storageBucketLabel,
    storagePartGroupHelp,
    storagePartGroupLabel
} from '@/modules/catalog-viewer/model/storageComposition'

/**
 * Folding the engine's storage-part rows into the buckets of `model/storageComposition.ts`.
 *
 * A bucket is always a **sum**: the entity index's own manifest is a deliberately small record next to the
 * attribute and price structures stored beside it, so picking a representative row would understate indexes by an
 * order of magnitude.
 */

/**
 * Which bucket a reported part type belongs to — the group when the group is one this build knows, the coarse
 * kind when it is not.
 */
export function storageBucketOf(part: StoragePartUsage): StorageBucket {
    if (part.group != undefined) {
        return entityDataBuckets[part.group] ?? bucketOfKind(part.kind)
    }
    return bucketOfKind(part.kind)
}

function bucketOfKind(kind: StoragePartKind | undefined): StorageBucket {
    switch (kind) {
        case StoragePartKind.EntityData:
            return StorageBucket.OtherEntityData
        case StoragePartKind.Index:
            return StorageBucket.Indexes
        case StoragePartKind.Metadata:
            return StorageBucket.Metadata
        default:
            return StorageBucket.Unclassified
    }
}

/**
 * Running sum of one group while the rows of a data store are folded.
 */
interface Accumulator {
    count: number
    totalBytes: bigint
    partTypes: string[]
}

function accumulate<K>(into: Map<K, Accumulator>, key: K, part: StoragePartUsage): void {
    const existing: Accumulator | undefined = into.get(key)
    if (existing == undefined) {
        into.set(key, { count: part.count, totalBytes: part.totalBytes, partTypes: [part.storagePartType] })
        return
    }
    existing.count += part.count
    existing.totalBytes += part.totalBytes
    existing.partTypes.push(part.storagePartType)
}

function averageOf(totalBytes: bigint, count: number): number | undefined {
    return count === 0 ? undefined : Number(totalBytes) / count
}

/**
 * Folds one data store's part rows into buckets and their groups. Buckets come out in
 * {@link canonicalStorageBuckets} order with the two fallback buckets appended, and an empty bucket is dropped —
 * a legend states what the tab can show, a row states what this store actually holds.
 */
export function summarizeStorageComposition(parts: Iterable<StoragePartUsage>): StorageComposition {
    const byBucket: Map<StorageBucket, Map<StoragePartGroup | undefined, Accumulator>> = new Map()
    let totalBytes: bigint = 0n
    let count: number = 0

    for (const part of parts) {
        const bucket: StorageBucket = storageBucketOf(part)
        let groups: Map<StoragePartGroup | undefined, Accumulator> | undefined = byBucket.get(bucket)
        if (groups == undefined) {
            groups = new Map()
            byBucket.set(bucket, groups)
        }
        accumulate(groups, part.group, part)
        totalBytes += part.totalBytes
        count += part.count
    }

    const order: StorageBucket[] = [
        ...canonicalStorageBuckets,
        StorageBucket.OtherEntityData,
        StorageBucket.Unclassified
    ]
    const buckets: StorageBucketRow[] = []
    for (const bucket of order) {
        const groups: Map<StoragePartGroup | undefined, Accumulator> | undefined = byBucket.get(bucket)
        if (groups == undefined) {
            continue
        }
        const bucketBytes: bigint = Array.from(groups.values())
            .reduce((sum: bigint, it: Accumulator) => sum + it.totalBytes, 0n)
        const bucketCount: number = Array.from(groups.values())
            .reduce((sum: number, it: Accumulator) => sum + it.count, 0)
        const groupRows: StorageGroupRow[] = Array.from(groups.entries())
            .map(([group, accumulator]: [StoragePartGroup | undefined, Accumulator]) => ({
                key: group ?? bucket,
                label: group != undefined ? storagePartGroupLabel(group) : storageBucketLabel(bucket),
                help: group != undefined ? storagePartGroupHelp(group) : undefined,
                partTypes: accumulator.partTypes,
                count: accumulator.count,
                totalBytes: accumulator.totalBytes,
                averageBytes: averageOf(accumulator.totalBytes, accumulator.count),
                share: share(accumulator.totalBytes, totalBytes)
            }))
            .sort((a: StorageGroupRow, b: StorageGroupRow) => Number(b.totalBytes - a.totalBytes))
        buckets.push({
            bucket,
            label: storageBucketLabel(bucket),
            help: storageBucketHelp(bucket),
            color: storageBucketColor(bucket),
            groups: groupRows,
            count: bucketCount,
            totalBytes: bucketBytes,
            averageBytes: averageOf(bucketBytes, bucketCount),
            share: share(bucketBytes, totalBytes)
        })
    }

    return { buckets, totalBytes, count }
}
