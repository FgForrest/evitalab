import { i18n } from '@/vue-plugins/i18n'
import { StoragePartGroup } from '@/modules/database-driver/request-response/statistics/StoragePartGroup'

/**
 * The kinds of data the Storage tab describes a data store in.
 *
 * The server classifies every part type itself — a closed set of fourteen groups over three kinds — so nothing
 * here recognises a class name. A bucket is `kind === ENTITY_DATA ? group : kind`, which is exactly the six kinds
 * of data the issue names plus the schema and header records every data store also holds. The fold itself lives in
 * `service/storageComposition.ts`.
 *
 * A row the server classified with a group this build does not know keeps its coarse kind, and one it classified
 * as nothing at all lands in {@link StorageBucket.Unclassified}. Neither is folded into
 * {@link StorageBucket.Indexes} — a catch-all that quietly absorbs the unknown is the failure this classification
 * exists to end.
 */
export enum StorageBucket {
    EntityBodies = 'entityBodies',
    Attributes = 'attributes',
    References = 'references',
    Prices = 'prices',
    AssociatedData = 'associatedData',
    Indexes = 'indexes',
    Metadata = 'metadata',
    /**
     * Entity data whose group this build does not know — a newer server. Never rendered against today's engine.
     */
    OtherEntityData = 'otherEntityData',
    /**
     * Rows the server classified as nothing at all. Shown rather than hidden, because bytes that belong nowhere
     * are a finding.
     */
    Unclassified = 'unclassified'
}

/**
 * Bar and legend order. The two fallback buckets are deliberately absent — they join the legend only on a
 * catalog that actually reports one.
 */
export const canonicalStorageBuckets: readonly StorageBucket[] = [
    StorageBucket.EntityBodies,
    StorageBucket.Attributes,
    StorageBucket.References,
    StorageBucket.Prices,
    StorageBucket.AssociatedData,
    StorageBucket.Indexes,
    StorageBucket.Metadata
]

const bucketColors: Readonly<Record<StorageBucket, string>> = {
    [StorageBucket.EntityBodies]: '#21BFE3',
    [StorageBucket.Attributes]: '#22a44e',
    [StorageBucket.References]: '#8e6fd8',
    [StorageBucket.Prices]: '#f7a729',
    [StorageBucket.AssociatedData]: '#487ad3',
    [StorageBucket.Indexes]: '#A5ACBC',
    [StorageBucket.Metadata]: '#23a5a5',
    [StorageBucket.OtherEntityData]: '#e0698c',
    [StorageBucket.Unclassified]: '#E13321'
}

/**
 * The entity-data groups and the bucket each one is reported as. Groups absent here fold by their kind.
 */
export const entityDataBuckets: Readonly<Partial<Record<StoragePartGroup, StorageBucket>>> = {
    [StoragePartGroup.EntityBody]: StorageBucket.EntityBodies,
    [StoragePartGroup.AttributeData]: StorageBucket.Attributes,
    [StoragePartGroup.ReferenceData]: StorageBucket.References,
    [StoragePartGroup.PriceData]: StorageBucket.Prices,
    [StoragePartGroup.AssociatedData]: StorageBucket.AssociatedData
}

export function storageBucketColor(bucket: StorageBucket): string {
    return bucketColors[bucket]
}

export function storageBucketLabel(bucket: StorageBucket): string {
    return i18n.global.t(`catalogViewer.storage.composition.bucket.label.${bucket}`)
}

export function storageBucketHelp(bucket: StorageBucket): string {
    return i18n.global.t(`catalogViewer.storage.composition.bucket.help.${bucket}`)
}

export function storagePartGroupLabel(group: StoragePartGroup): string {
    return i18n.global.t(`catalogViewer.storage.composition.group.label.${group}`)
}

export function storagePartGroupHelp(group: StoragePartGroup): string {
    return i18n.global.t(`catalogViewer.storage.composition.group.help.${group}`)
}

/**
 * One group of one bucket. A bucket that sums several groups is what the drill-down opens into — *Attribute
 * index* next to *Attributes* is the pair a schema owner reads.
 */
export interface StorageGroupRow {
    readonly key: string
    readonly label: string
    readonly help: string | undefined
    /**
     * The part types summed into this row, in the order the server sent them. The engine's own identity for the
     * record, kept visible even though nothing classifies by it.
     */
    readonly partTypes: readonly string[]
    readonly count: number
    readonly totalBytes: bigint
    readonly averageBytes: number | undefined
    readonly share: number | undefined
}

/**
 * One bucket of one data store, with the groups it summed.
 */
export interface StorageBucketRow {
    readonly bucket: StorageBucket
    readonly label: string
    readonly help: string
    readonly color: string
    readonly groups: readonly StorageGroupRow[]
    readonly count: number
    readonly totalBytes: bigint
    readonly averageBytes: number | undefined
    readonly share: number | undefined
}

/**
 * What one data store — a collection's, or the catalog's own — is made of.
 */
export interface StorageComposition {
    readonly buckets: readonly StorageBucketRow[]
    /**
     * Sum of the breakdown: the store's record *payload*, which is less than its size on disk.
     */
    readonly totalBytes: bigint
    readonly count: number
}
