import { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'
import { VisualisedHierarchyResult } from '../model/hierarchy/VisualisedHierarchyResult'

/**
 * Parses hierarchy extra results into a fully resolved {@link VisualisedHierarchyResult} DTO.
 * Builds tree structures and resolves representative attributes internally.
 */
export interface HierarchyResultParser<TQueryResult = unknown> {
    parse(queryResult: TQueryResult, entitySchema: EntitySchema, catalogName: string): Promise<VisualisedHierarchyResult>
}
