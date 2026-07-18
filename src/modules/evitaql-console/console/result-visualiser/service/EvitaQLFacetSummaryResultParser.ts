import type { FacetSummaryResultParser } from '@/modules/console/result-visualiser/service/FacetSummaryResultParser'
import { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'
import {
    VisualisedFacetSummary,
    VisualisedReferenceFacets,
    VisualisedFacetGroup
} from '@/modules/console/result-visualiser/model/facet-summary/VisualisedFacetSummary'
import { VisualisedFacetGroupStatistics } from '@/modules/console/result-visualiser/model/facet-summary/VisualisedFacetGroupStatistics'
import { VisualisedFacetStatistics } from '@/modules/console/result-visualiser/model/facet-summary/VisualisedFacetStatistics'
import { EvitaClient } from '@/modules/database-driver/EvitaClient'
import { resolveRepresentativeAttributes } from '@/modules/console/result-visualiser/service/utils/representativeAttributes'
import { buildRepresentativeTitle, toPrintableAttributeValue } from '@/modules/console/result-visualiser/service/utils/representativeTitle'
import { formatImpactDifference } from '@/modules/console/result-visualiser/service/utils/impactFormatting'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { GroupByUtil } from '@/utils/GroupByUtil'
import type { Grouped } from '@/utils/GroupByUtil'
import { EvitaResponse } from '@/modules/database-driver/request-response/data/EvitaResponse'
import { FacetGroupStatistics } from '@/modules/database-driver/request-response/data/FacetGroupStatistics'
import { FacetStatistics } from '@/modules/database-driver/request-response/data/FacetStatistics'
import { Entity } from '@/modules/database-driver/request-response/data/Entity'

/**
 * {@link FacetSummaryResultParser} for EvitaQL query language. Works directly with typed
 * {@link FacetGroupStatistics} and {@link FacetStatistics} from the internal model.
 */
export class EvitaQLFacetSummaryResultParser implements FacetSummaryResultParser<EvitaResponse> {

    private readonly evitaClient: EvitaClient

    constructor(evitaClient: EvitaClient) {
        this.evitaClient = evitaClient
    }

    async parse(queryResult: EvitaResponse, entitySchema: EntitySchema, catalogName: string): Promise<VisualisedFacetSummary> {
        const facetGroupStatistics = queryResult.extraResults?.facetGroupStatistics
        if (facetGroupStatistics == undefined) {
            return new VisualisedFacetSummary([])
        }

        const groupsByReference: Grouped<FacetGroupStatistics> = GroupByUtil.groupBy(facetGroupStatistics, 'referenceName')

        const references: VisualisedReferenceFacets[] = []

        for (const referenceName in groupsByReference) {
            const referenceSchema = entitySchema.references.get(referenceName)
            if (referenceSchema == undefined) {
                throw new UnexpectedError(`Reference '${referenceName}' not found in entity '${entitySchema.name}'.`)
            }

            const groupRepresentativeAttributes: string[] = referenceSchema.referencedGroupTypeManaged
                ? await resolveRepresentativeAttributes(this.evitaClient, catalogName, referenceSchema.referencedGroupType as string)
                : []

            const facetRepresentativeAttributes: string[] = await resolveRepresentativeAttributes(
                this.evitaClient,
                catalogName,
                referenceSchema.entityType as string
            )

            const groupOfGroups: FacetGroupStatistics[] = groupsByReference[referenceName]
            const groups: VisualisedFacetGroup[] = groupOfGroups.map((groupStats: FacetGroupStatistics) => {
                const groupStatistics = this.resolveGroupStatistics(groupStats, groupRepresentativeAttributes)
                const facets = groupStats.facetStatistics.toArray().map((facetStats: FacetStatistics) =>
                    this.resolveFacetStatistics(queryResult, facetStats, facetRepresentativeAttributes)
                )
                return new VisualisedFacetGroup(groupStatistics, facets)
            })

            references.push(new VisualisedReferenceFacets(referenceSchema, groups))
        }

        return new VisualisedFacetSummary(references)
    }

    private resolveGroupStatistics(
        groupStats: FacetGroupStatistics,
        groupRepresentativeAttributes: string[]
    ): VisualisedFacetGroupStatistics {
        const count = groupStats.count

        if (groupStats.groupEntity == undefined && groupStats.groupEntityReference == undefined) {
            return new VisualisedFacetGroupStatistics(undefined, undefined, count)
        }
        const primaryKey: number | undefined = groupStats.groupEntityReference != undefined
            ? groupStats.groupEntityReference.primaryKey
            : groupStats.groupEntity!.primaryKey
        const title = this.resolveRepresentativeTitle(groupStats.groupEntity, groupRepresentativeAttributes)

        return new VisualisedFacetGroupStatistics(primaryKey, title, count)
    }

    private resolveFacetStatistics(
        queryResult: EvitaResponse,
        facetStats: FacetStatistics,
        facetRepresentativeAttributes: string[]
    ): VisualisedFacetStatistics {
        const requested: boolean | undefined = facetStats.requested
        const primaryKey: number | undefined = facetStats.facetEntityReference != undefined
            ? facetStats.facetEntityReference.primaryKey
            : facetStats.facetEntity!.primaryKey
        const title = this.resolveRepresentativeTitle(facetStats.facetEntity, facetRepresentativeAttributes)
        const numberOfEntities: number | undefined = queryResult.recordPage.totalRecordCount
        const impactDifference = formatImpactDifference(facetStats.impact)
        const impactMatchCount: number | undefined = facetStats.matchCount
        const count: number | undefined = facetStats.count

        return new VisualisedFacetStatistics(requested, primaryKey, title, numberOfEntities, impactDifference, impactMatchCount, count)
    }

    private resolveRepresentativeTitle(entity: Entity | undefined, representativeAttributes: string[]): string | undefined {
        if (!entity) return undefined

        const possibleAttributes: { value: unknown; isRepresentative: boolean }[] = []
        entity.allAttributes.forEach(it => {
            possibleAttributes.push({
                value: it.value,
                isRepresentative: representativeAttributes.includes(it.name)
            })
        })
        return buildRepresentativeTitle(possibleAttributes, toPrintableAttributeValue)
    }
}
