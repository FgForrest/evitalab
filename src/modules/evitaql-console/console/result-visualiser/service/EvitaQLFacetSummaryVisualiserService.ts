import { EvitaQLResultVisualiserService } from '@/modules/evitaql-console/console/result-visualiser/service/EvitaQLResultVisualiserService'
import { FacetSummaryVisualiserService } from '@/modules/console/result-visualiser/service/FacetSummaryVisualiserService'
import { EntitySchema } from '@/modules/connection/model/schema/EntitySchema'
import { ReferenceSchema } from '@/modules/connection/model/schema/ReferenceSchema'
import { VisualisedFacetGroupStatistics } from '@/modules/console/result-visualiser/model/facet-summary/VisualisedFacetGroupStatistics'
import { VisualisedFacetStatistics } from '@/modules/console/result-visualiser/model/facet-summary/VisualisedFacetStatistics'
import { Result } from '@/modules/console/result-visualiser/model/Result'
import { Value } from '@/modules/connection/model/Value'
import { FacetGroupStatistics } from '@/modules/connection/model/data/FacetGroupStatistics'
import { Entity } from '@/modules/connection/model/data/Entity'
import Immutable, { List } from 'immutable'
import { GroupByUtil, Grouped } from '@/utils/GroupByUtil'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { FacetStatistics } from '@/modules/connection/model/data/FacetStatistics'
import { Response } from '@/modules/connection/model/data/Response'

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
            const referenceSchema: ReferenceSchema | undefined = entitySchema.references.getOrThrow().get(referenceName)
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
        const count = groupStatisticsResult.count.getOrElse(0)

        if (groupStatisticsResult.groupEntity.getOrThrow() == undefined &&
            groupStatisticsResult.groupEntityReference.getOrThrow() == undefined) {
            return new VisualisedFacetGroupStatistics(count)
        }
        const primaryKey: number | undefined = groupStatisticsResult.groupEntityReference.getOrElse(undefined) != undefined
            ? groupStatisticsResult.groupEntityReference.getOrThrow()!.primaryKey
            : groupStatisticsResult.groupEntity.getOrThrow()!.primaryKey
        const title: string | undefined = this.visualiserService.resolveRepresentativeTitleForEntityResult(
            groupStatisticsResult.groupEntity.getOrElse(undefined),
            groupRepresentativeAttributes
        )

        return new VisualisedFacetGroupStatistics(
            primaryKey,
            title,
            count
        )
    }
    findFacetStatisticsResults(groupStatisticsResult: FacetGroupStatistics): Result {
        return groupStatisticsResult.facetStatistics.getOrThrow()
    }

    resolveFacetStatistics(
        queryResult: Response,
        facetStatisticsResult: FacetStatistics,
        facetRepresentativeAttributes: string[]
    ): VisualisedFacetStatistics {
        const requested: boolean | undefined = facetStatisticsResult.requested.getOrElse(false)

        // todo lho rewrite entity access
        const primaryKey: number | undefined = facetStatisticsResult.facetEntityReference.getOrElse(undefined) != undefined
            ? facetStatisticsResult.facetEntityReference.getOrThrow()!.primaryKey
            : facetStatisticsResult.facetEntity.getOrThrow()!.primaryKey
        const title: string | undefined = this.visualiserService.resolveRepresentativeTitleForEntityResult(
            facetStatisticsResult.facetEntity.getOrElse(undefined),
            facetRepresentativeAttributes
        )

        const numberOfEntities: number | undefined = queryResult
            .recordPage.getOrThrow()
            .totalRecordCount.getOrElse(0)

        const impactDifference: string | undefined = (() => {
            const difference: number | undefined = facetStatisticsResult.impact.getOrElse(undefined)
            if (difference == undefined) {
                return undefined
            }

            return `${difference > 0 ? '+' : ''}${difference}`
        })()
        const impactMatchCount: number | undefined = facetStatisticsResult.matchCount?.getOrElse(undefined)
        const count: number | undefined = facetStatisticsResult.count.getOrElse(0)

        return new VisualisedFacetStatistics(requested, primaryKey, title, numberOfEntities, impactDifference, impactMatchCount, count)
    }
}
