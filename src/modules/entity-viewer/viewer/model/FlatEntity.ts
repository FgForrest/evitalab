import { EntityPropertyValue } from '@/modules/entity-viewer/viewer/model/EntityPropertyValue'

/**
 * Represents a single flattened entity for data table rendering. Where {key} is a serialized {@link EntityPropertyKey}.
 */
//TODO: Replace to ImmutableList
export type FlatEntity = {
    readonly [key: string]: EntityPropertyValue | EntityPropertyValue[]
}
