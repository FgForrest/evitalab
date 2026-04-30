import type { ReferenceSummaryResultParser } from '@/modules/console/result-visualiser/service/ReferenceSummaryResultParser'
import { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'
import {
    VisualisedReferenceSummary,
    VisualisedReferenceStatistics,
    VisualisedReferenceGroup
} from '@/modules/console/result-visualiser/model/reference-summary/VisualisedReferenceSummary'
import { VisualisedReferenceGroupStatistics } from '@/modules/console/result-visualiser/model/reference-summary/VisualisedReferenceGroupStatistics'
import { VisualisedFacetStatistics } from '@/modules/console/result-visualiser/model/reference-summary/VisualisedFacetStatistics'
import { EvitaClient } from '@/modules/database-driver/EvitaClient'
import { resolveRepresentativeAttributes } from '@/modules/console/result-visualiser/service/utils/representativeAttributes'
import { buildRepresentativeTitle, toPrintableAttributeValue } from '@/modules/console/result-visualiser/service/utils/representativeTitle'
import { formatImpactDifference } from '@/modules/console/result-visualiser/service/utils/impactFormatting'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { GroupByUtil } from '@/utils/GroupByUtil'
import type { Grouped } from '@/utils/GroupByUtil'
import { EvitaResponse } from '@/modules/database-driver/request-response/data/EvitaResponse'
import { ReferenceGroupStatistics } from '@/modules/database-driver/request-response/data/ReferenceGroupStatistics'
import { FacetStatistics } from '@/modules/database-driver/request-response/data/FacetStatistics'
import { Entity } from '@/modules/database-driver/request-response/data/Entity'
import { VisualisedHistogramStatistics } from '@/modules/console/result-visualiser/model/reference-summary/VisualisedHistogramStatistics'
import { VisualisedHistogram } from '@/modules/console/result-visualiser/model/histogram/VisualisedHistogram'
import { Histogram } from '@/modules/database-driver/request-response/data/Histogram'

export class EvitaQLReferenceSummaryResultParser implements ReferenceSummaryResultParser<EvitaResponse> {

    private readonly evitaClient: EvitaClient

    constructor(evitaClient: EvitaClient) {
        this.evitaClient = evitaClient
    }

    async parse(queryResult: EvitaResponse, entitySchema: EntitySchema, catalogName: string): Promise<VisualisedReferenceSummary> {
        const referenceGroupStatistics = queryResult.extraResults?.referenceGroupStatistics
        if (referenceGroupStatistics == undefined) {
            return new VisualisedReferenceSummary([])
        }

        const groupsByReference: Grouped<ReferenceGroupStatistics> = GroupByUtil.groupBy(referenceGroupStatistics, 'referenceName')

        const references: VisualisedReferenceStatistics[] = []

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

            const groupOfGroups: ReferenceGroupStatistics[] = groupsByReference[referenceName]
            const groups: VisualisedReferenceGroup[] = groupOfGroups.map((groupStats: ReferenceGroupStatistics) => {
                const groupStatistics = this.resolveGroupStatistics(groupStats, groupRepresentativeAttributes)
                const facets = groupStats.facetStatistics.toArray().map((facetStats: FacetStatistics) =>
                    this.resolveFacetStatistics(queryResult, facetStats, facetRepresentativeAttributes)
                )
                const histograms: VisualisedHistogramStatistics[] = []
                groupStats.histogramStatistics.forEach((histogram: Histogram, indexName: string) => {
                    histograms.push(new VisualisedHistogramStatistics(
                        indexName,
                        VisualisedHistogram.fromInternal(histogram)
                    ))
                })
                return new VisualisedReferenceGroup(groupStatistics, facets, histograms)
            })

            references.push(new VisualisedReferenceStatistics(referenceSchema, groups))
        }

        return new VisualisedReferenceSummary(references)
    }

    private resolveGroupStatistics(
        groupStats: ReferenceGroupStatistics,
        groupRepresentativeAttributes: string[]
    ): VisualisedReferenceGroupStatistics {
        const count = groupStats.count

        if (groupStats.groupEntity == undefined && groupStats.groupEntityReference == undefined) {
            return new VisualisedReferenceGroupStatistics(undefined, undefined, count)
        }
        const primaryKey: number | undefined = groupStats.groupEntityReference != undefined
            ? groupStats.groupEntityReference.primaryKey
            : groupStats.groupEntity!.primaryKey
        const title = this.resolveRepresentativeTitle(groupStats.groupEntity, groupRepresentativeAttributes)

        return new VisualisedReferenceGroupStatistics(primaryKey, title, count)
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

        const possibleAttributes: { value: any; isRepresentative: boolean }[] = []
        entity.allAttributes.forEach(it => {
            possibleAttributes.push({
                value: it.value,
                isRepresentative: representativeAttributes.includes(it.name)
            })
        })
        return buildRepresentativeTitle(possibleAttributes, toPrintableAttributeValue)
    }
}
