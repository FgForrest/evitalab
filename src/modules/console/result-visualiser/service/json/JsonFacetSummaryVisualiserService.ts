import {
    JsonResultVisualiserService
} from '@/modules/console/result-visualiser/service/json/JsonResultVisualiserService'
import {
    FacetSummaryVisualiserService
} from '@/modules/console/result-visualiser/service/FacetSummaryVisualiserService'
import { Result } from '@/modules/console/result-visualiser/model/Result'
import { EntitySchema } from '@/modules/connection/model/schema/EntitySchema'
import { ReferenceSchema } from '@/modules/connection/model/schema/ReferenceSchema'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import {
    VisualisedFacetGroupStatistics
} from '@/modules/console/result-visualiser/model/facet-summary/VisualisedFacetGroupStatistics'
import {
    VisualisedFacetStatistics
} from '@/modules/console/result-visualiser/model/facet-summary/VisualisedFacetStatistics'
import { NamingConvention } from '@/modules/connection/model/NamingConvetion'

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
        for (const referenceName of Object.keys(facetSummaryResult)) {
            const referenceSchema: ReferenceSchema | undefined = entitySchema.references
                .getIfSupported()
                ?.find(reference => reference.nameVariants
                    .getIfSupported()
                    ?.get(NamingConvention.CamelCase) === referenceName)
            if (referenceSchema == undefined) {
                throw new UnexpectedError(`Reference '${referenceName}' not found in entity '${entitySchema.name}'.`)
            }
            const groups = facetSummaryResult[referenceName]
            if (groups instanceof Array) {
                referencesWithGroups.push([referenceSchema, groups])
            } else {
                referencesWithGroups.push([referenceSchema, [groups]])
            }
        }
        return referencesWithGroups
    }

    resolveFacetGroupStatistics(groupStatisticsResult: Result, groupRepresentativeAttributes: string[]): VisualisedFacetGroupStatistics {
        const count: number | undefined = groupStatisticsResult['count']

        const groupEntityResult: Result | undefined = groupStatisticsResult['groupEntity']
        if (!groupEntityResult) {
            return { count }
        }
        const primaryKey: number | undefined = groupEntityResult['primaryKey']
        const title: string | undefined = this.visualiserService.resolveRepresentativeTitleForEntityResult(
            groupEntityResult,
            groupRepresentativeAttributes
        )

        return new VisualisedFacetGroupStatistics(primaryKey, title, count)
    }

    findFacetStatisticsResults(groupStatisticsResult: Result): Result[] {
        return groupStatisticsResult['facetStatistics'] || []
    }

    resolveFacetStatistics(queryResult: Result, facetStatisticsResult: Result, facetRepresentativeAttributes: string[]): VisualisedFacetStatistics {
        const facetEntityResult: Result | undefined = facetStatisticsResult['facetEntity']

        const requested: boolean | undefined = facetStatisticsResult['requested']

        const primaryKey: number | undefined = facetEntityResult?.['primaryKey']
        const title: string | undefined = this.visualiserService.resolveRepresentativeTitleForEntityResult(
            facetEntityResult,
            facetRepresentativeAttributes
        )

        const numberOfEntities: number | undefined = queryResult['recordPage']?.['totalRecordCount'] ?? queryResult['recordStrip']?.['totalRecordCount']

        const impactResult: Result | undefined = facetStatisticsResult['impact']
        const impactDifference: string | undefined = (() => {
            const difference: number | undefined = impactResult?.['difference']
            if (difference == undefined) {
                return undefined
            }

            return `${difference > 0 ? '+' : ''}${difference}`
        })()
        const impactMatchCount: number | undefined = impactResult?.['matchCount']
        const count: number | undefined = facetStatisticsResult['count']

        return new VisualisedFacetStatistics(requested, primaryKey, title, numberOfEntities, impactDifference, impactMatchCount, count)
    }
}
