import { EntityPropertyValue } from '@/modules/entity-viewer/viewer/model/EntityPropertyValue'

/**
 * Represents a single flattened entity for data table rendering. Where {key} is a serialized {@link EntityPropertyKey}.
 *
 * Deliberately a plain object rather than an Immutable collection: the rows are handed straight to
 * Vuetify's data table, which reads cells by plain property access, and `readonly` together with
 * `noUncheckedIndexedAccess` already gives compile-time immutability and undefined-safe reads.
 */
export type FlatEntity = {
    readonly [key: string]: EntityPropertyValue | EntityPropertyValue[]
}
