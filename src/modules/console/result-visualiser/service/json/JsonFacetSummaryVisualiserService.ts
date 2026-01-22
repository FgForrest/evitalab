import {
    JsonResultVisualiserService
} from '@/modules/console/result-visualiser/service/json/JsonResultVisualiserService'
import type {
    FacetSummaryVisualiserService
} from '@/modules/console/result-visualiser/service/FacetSummaryVisualiserService'
import type { Result } from '@/modules/console/result-visualiser/model/Result'
import { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'
import { ReferenceSchema } from '@/modules/database-driver/request-response/schema/ReferenceSchema'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import {
    VisualisedFacetGroupStatistics
} from '@/modules/console/result-visualiser/model/facet-summary/VisualisedFacetGroupStatistics'
import {
    VisualisedFacetStatistics
} from '@/modules/console/result-visualiser/model/facet-summary/VisualisedFacetStatistics'
import { NamingConvention } from '@/modules/database-driver/request-response/NamingConvetion'

/**
 * Common abstract for all JSON-based facet summary visualiser services.
 */
export abstract class JsonFacetSummaryVisualiserService<VS extends JsonResultVisualiserService> implements FacetSummaryVisualiserService {
    protected readonly visualiserService: VS

    protected constructor(visualiserService: VS) {
        this.visualiserService = visualiserService
    }

    findFacetGroupStatisticsByReferencesResults(facetSummaryResult: Result, entitySchema: EntitySchema): [ReferenceSchema, Result[]][] {
        const referencesWithGroups: [ReferenceSchema, Result[]][] = []
        const facetSummary = facetSummaryResult as Record<string, unknown>
        for (const referenceName of Object.keys(facetSummary)) {
            const referenceSchema: ReferenceSchema | undefined = entitySchema.references
                .find(reference => reference.nameVariants
                    .get(NamingConvention.CamelCase) === referenceName)
            if (referenceSchema == undefined) {
                throw new UnexpectedError(`Reference '${referenceName}' not found in entity '${entitySchema.name}'.`)
            }
            const groups = facetSummary[referenceName]
            if (groups instanceof Array) {
                referencesWithGroups.push([referenceSchema, groups as Result[]])
            } else {
                referencesWithGroups.push([referenceSchema, [groups]])
            }
        }
        return referencesWithGroups
    }

    resolveFacetGroupStatistics(groupStatisticsResult: Result, groupRepresentativeAttributes: string[]): VisualisedFacetGroupStatistics {
        const stats = groupStatisticsResult as Record<string, unknown>
        const count: number | undefined = stats['count'] as number | undefined

        const groupEntityResult = stats['groupEntity']
        if (!groupEntityResult) {
            return { count }
        }
        const groupEntity = groupEntityResult as Record<string, unknown>
        const primaryKey: number | undefined = groupEntity['primaryKey'] as number | undefined
        const title: string | undefined = this.visualiserService.resolveRepresentativeTitleForEntityResult(
            groupEntityResult,
            groupRepresentativeAttributes
        )

        return new VisualisedFacetGroupStatistics(primaryKey, title, count)
    }

    findFacetStatisticsResults(groupStatisticsResult: Result): Result[] {
        const stats = groupStatisticsResult as Record<string, unknown>
        return (stats['facetStatistics'] as Result[]) || []
    }

    resolveFacetStatistics(queryResult: Result, facetStatisticsResult: Result, facetRepresentativeAttributes: string[]): VisualisedFacetStatistics {
        const facetStats = facetStatisticsResult as Record<string, unknown>
        const facetEntityResult = facetStats['facetEntity']

        const requested: boolean | undefined = facetStats['requested'] as boolean | undefined

        const facetEntity = facetEntityResult as Record<string, unknown> | undefined
        const primaryKey: number | undefined = facetEntity?.['primaryKey'] as number | undefined
        const title: string | undefined = this.visualiserService.resolveRepresentativeTitleForEntityResult(
            facetEntityResult,
            facetRepresentativeAttributes
        )

        const query = queryResult as Record<string, unknown>
        const recordPage = query['recordPage'] as Record<string, unknown> | undefined
        const recordStrip = query['recordStrip'] as Record<string, unknown> | undefined
        const numberOfEntities: number | undefined = (recordPage?.['totalRecordCount'] ?? recordStrip?.['totalRecordCount']) as number | undefined

        const impactResult = facetStats['impact']
        const impact = impactResult as Record<string, unknown> | undefined
        const impactDifference: string | undefined = (() => {
            const difference: number | undefined = impact?.['difference'] as number | undefined
            if (difference == undefined) {
                return undefined
            }

            return `${difference > 0 ? '+' : ''}${difference}`
        })()
        const impactMatchCount: number | undefined = impact?.['matchCount'] as number | undefined
        const count: number | undefined = facetStats['count'] as number | undefined

        return new VisualisedFacetStatistics(requested, primaryKey, title, numberOfEntities, impactDifference, impactMatchCount, count)
    }
}
