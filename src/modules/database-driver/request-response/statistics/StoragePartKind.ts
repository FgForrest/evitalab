import { StoragePartGroup } from '@/modules/database-driver/request-response/statistics/StoragePartGroup'

/**
 * What a storage part fundamentally is — the coarse fold of {@link StoragePartGroup}.
 *
 * The three answer different questions: entity data shrinks only by storing less, an index shrinks by indexing
 * less (a schema decision that loses no data), and metadata is what the store needs to describe itself and cannot
 * be acted on at all.
 */
export enum StoragePartKind {
    EntityData = 'entityData',
    Index = 'index',
    Metadata = 'metadata'
}

/**
 * The kind a group belongs to.
 *
 * The server sends both fields, but the kind is *derived* here rather than read off the wire — the same thing the
 * Java driver does — so a row whose two fields somehow disagreed could not produce a breakdown that contradicts
 * itself. The wire `kind` is read only for a group number this build does not know.
 */
export function storagePartKindOf(group: StoragePartGroup): StoragePartKind {
    switch (group) {
        case StoragePartGroup.EntityBody:
        case StoragePartGroup.AttributeData:
        case StoragePartGroup.AssociatedData:
        case StoragePartGroup.PriceData:
        case StoragePartGroup.ReferenceData:
            return StoragePartKind.EntityData
        case StoragePartGroup.IndexManifest:
        case StoragePartGroup.AttributeIndex:
        case StoragePartGroup.PriceIndex:
        case StoragePartGroup.ReferenceIndex:
        case StoragePartGroup.FacetIndex:
        case StoragePartGroup.HierarchyIndex:
        case StoragePartGroup.ReferenceHistogramIndex:
            return StoragePartKind.Index
        case StoragePartGroup.Schema:
        case StoragePartGroup.Header:
            return StoragePartKind.Metadata
    }
}
