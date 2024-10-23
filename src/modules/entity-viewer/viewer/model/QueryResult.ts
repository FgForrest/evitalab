import { FlatEntity } from '@/modules/entity-viewer/viewer/model/FlatEntity'

/**
 * Holds query result of data grid console query.
 */
export type QueryResult = {
    readonly entities: FlatEntity[],
    readonly totalEntitiesCount: number
}
