import { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'
import { VisualisedFacetSummary } from '../model/facet-summary/VisualisedFacetSummary'

/**
 * Parses facet summary extra results into a fully resolved {@link VisualisedFacetSummary} DTO.
 * Fetches representative attributes for group/facet entity types internally.
 */
export interface FacetSummaryResultParser<TQueryResult = unknown> {
    parse(queryResult: TQueryResult, entitySchema: EntitySchema, catalogName: string): Promise<VisualisedFacetSummary>
}
