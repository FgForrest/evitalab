import { EvitaQLResultVisualiserService } from '@/modules/evitaql-console/console/result-visualiser/service/EvitaQLResultVisualiserService'
import { FacetSummaryVisualiserService } from '@/modules/console/result-visualiser/service/FacetSummaryVisualiserService'
import { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'
import { ReferenceSchema } from '@/modules/database-driver/request-response/schema/ReferenceSchema'
import { VisualisedFacetGroupStatistics } from '@/modules/console/result-visualiser/model/facet-summary/VisualisedFacetGroupStatistics'
import { VisualisedFacetStatistics } from '@/modules/console/result-visualiser/model/facet-summary/VisualisedFacetStatistics'
import { Result } from '@/modules/console/result-visualiser/model/Result'
import Immutable from 'immutable'
import { GroupByUtil, Grouped } from '@/utils/GroupByUtil'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { FacetGroupStatistics } from '@/modules/database-driver/request-response/data/FacetGroupStatistics'
import { FacetStatistics } from '@/modules/database-driver/request-response/data/FacetStatistics'
import { EvitaResponse } from '@/modules/database-driver/request-response/data/EvitaResponse'

/**
 * {@link FacetSummaryVisualiserService} for EvitaQL query language.
 */
export class EvitaQLFacetSummaryVisualiserService
    implements FacetSummaryVisualiserService
{
    private readonly visualiserService: EvitaQLResultVisualiserService
    constructor(visualiserService: EvitaQLResultVisualiserService) {
        this.visualiserService = visualiserService
    }

    findFacetGroupStatisticsByReferencesResults(
        facetSummaryResult: Immutable.List<FacetGroupStatistics>,
        entitySchema: EntitySchema
    ): [ReferenceSchema, Result[]][] {
        const outputFacetSummary: [ReferenceSchema, Result[]][] = []

        const groupsByReference: Grouped<FacetGroupStatistics> = GroupByUtil.groupBy(facetSummaryResult, 'referenceName')

        for (const referenceName in groupsByReference) {
            const referenceSchema: ReferenceSchema | undefined = entitySchema.references.get(referenceName)
            if (referenceSchema == undefined) {
                throw new UnexpectedError(`Reference '${referenceName}' not found in entity '${entitySchema.name}'.`)
            }

            const groupOfGroups: FacetGroupStatistics[] = groupsByReference[referenceName]
            outputFacetSummary.push([referenceSchema, groupOfGroups])
        }
        return outputFacetSummary

    }
    resolveFacetGroupStatistics(
        groupStatisticsResult: FacetGroupStatistics,
        groupRepresentativeAttributes: string[]
    ): VisualisedFacetGroupStatistics {
        const count = groupStatisticsResult.count

        if (groupStatisticsResult.groupEntity == undefined &&
            groupStatisticsResult.groupEntityReference == undefined) {
            return new VisualisedFacetGroupStatistics(count)
        }
        const primaryKey: number | undefined = groupStatisticsResult.groupEntityReference != undefined
            ? groupStatisticsResult.groupEntityReference.primaryKey
            : groupStatisticsResult.groupEntity!.primaryKey
        const title: string | undefined = this.visualiserService.resolveRepresentativeTitleForEntityResult(
            groupStatisticsResult.groupEntity,
            groupRepresentativeAttributes
        )

        return new VisualisedFacetGroupStatistics(
            primaryKey,
            title,
            count
        )
    }
    findFacetStatisticsResults(groupStatisticsResult: FacetGroupStatistics): Result {
        return groupStatisticsResult.facetStatistics
    }

    resolveFacetStatistics(
        queryResult: EvitaResponse,
        facetStatisticsResult: FacetStatistics,
        facetRepresentativeAttributes: string[]
    ): VisualisedFacetStatistics {
        const requested: boolean | undefined = facetStatisticsResult.requested

        // todo lho rewrite entity access
        const primaryKey: number | undefined = facetStatisticsResult.facetEntityReference != undefined
            ? facetStatisticsResult.facetEntityReference.primaryKey
            : facetStatisticsResult.facetEntity!.primaryKey
        const title: string | undefined = this.visualiserService.resolveRepresentativeTitleForEntityResult(
            facetStatisticsResult.facetEntity,
            facetRepresentativeAttributes
        )

        const numberOfEntities: number | undefined = queryResult
            .recordPage
            .totalRecordCount

        const impactDifference: string | undefined = (() => {
            const difference: number | undefined = facetStatisticsResult.impact
            if (difference == undefined) {
                return undefined
            }

            return `${difference > 0 ? '+' : ''}${difference}`
        })()
        const impactMatchCount: number | undefined = facetStatisticsResult.matchCount
        const count: number | undefined = facetStatisticsResult.count

        return new VisualisedFacetStatistics(requested, primaryKey, title, numberOfEntities, impactDifference, impactMatchCount, count)
    }
}
