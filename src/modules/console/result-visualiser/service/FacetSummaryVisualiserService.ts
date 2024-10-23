import { Result } from '@/modules/console/result-visualiser/model/Result'
import { EntitySchema } from '@/modules/connection/model/schema/EntitySchema'
import { ReferenceSchema } from '@/modules/connection/model/schema/ReferenceSchema'
import {
    VisualisedFacetGroupStatistics
} from '@/modules/console/result-visualiser/model/facet-summary/VisualisedFacetGroupStatistics'
import {
    VisualisedFacetStatistics
} from '@/modules/console/result-visualiser/model/facet-summary/VisualisedFacetStatistics'

/**
 * Service for visualising raw JSON facet summary results.
 */
export interface FacetSummaryVisualiserService {
    /**
     * Tries to find references with group statistics results in the facet summary result.
     */
    findFacetGroupStatisticsByReferencesResults(facetSummaryResult: Result, entitySchema: EntitySchema): [ReferenceSchema, Result[]][]

    /**
     * Resolves visualisable facet group statistics from the facet group statistics result.
     */
    resolveFacetGroupStatistics(groupStatisticsResult: Result, groupRepresentativeAttributes: string[]): VisualisedFacetGroupStatistics

    /**
     * Tries to find facet statistics results in the facet group statistics result.
     */
    findFacetStatisticsResults(groupStatisticsResult: Result): Result

    /**
     * Resolves visualisable facet statistics from the facet statistics result.
     */
    resolveFacetStatistics(queryResult: Result, facetStatisticsResult: Result, facetRepresentativeAttributes: string[]): VisualisedFacetStatistics
}
