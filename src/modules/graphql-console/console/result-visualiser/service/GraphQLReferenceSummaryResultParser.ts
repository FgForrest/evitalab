import { List as ImmutableList } from 'immutable'
import type { ReferenceSummaryResultParser } from '@/modules/console/result-visualiser/service/ReferenceSummaryResultParser'
import type { GraphQLResultNode } from '@/modules/database-driver/connector/gql/model/GraphQLResultNode'
import { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'
import {
    VisualisedReferenceSummary,
    VisualisedReferenceStatistics,
    VisualisedReferenceGroup
} from '@/modules/console/result-visualiser/model/reference-summary/VisualisedReferenceSummary'
import { VisualisedReferenceGroupStatistics } from '@/modules/console/result-visualiser/model/reference-summary/VisualisedReferenceGroupStatistics'
import { VisualisedFacetStatistics } from '@/modules/console/result-visualiser/model/reference-summary/VisualisedFacetStatistics'
import { EvitaClient } from '@/modules/database-driver/EvitaClient'
import { findSchemaByName } from '@/modules/console/result-visualiser/service/utils/schemaMatching'
import { resolveRepresentativeAttributes } from '@/modules/console/result-visualiser/service/utils/representativeAttributes'
import { buildRepresentativeTitle, toPrintableAttributeValue } from '@/modules/console/result-visualiser/service/utils/representativeTitle'
import { formatImpactDifference } from '@/modules/console/result-visualiser/service/utils/impactFormatting'
import { VisualisedHistogramStatistics } from '@/modules/console/result-visualiser/model/reference-summary/VisualisedHistogramStatistics'
import { VisualisedHistogram } from '@/modules/console/result-visualiser/model/histogram/VisualisedHistogram'

export class GraphQLReferenceSummaryResultParser implements ReferenceSummaryResultParser {

    private readonly evitaClient: EvitaClient

    constructor(evitaClient: EvitaClient) {
        this.evitaClient = evitaClient
    }

    async parse(queryResult: unknown, entitySchema: EntitySchema, catalogName: string): Promise<VisualisedReferenceSummary> {
        const result = queryResult as GraphQLResultNode
        const referenceSummaryResult = result['extraResults']?.['referenceSummary']
        if (!referenceSummaryResult) {
            return new VisualisedReferenceSummary([])
        }

        const references: VisualisedReferenceStatistics[] = []

        for (const referenceName of Object.keys(referenceSummaryResult)) {
            const referenceSchema = findSchemaByName(
                referenceName,
                entitySchema.references.values(),
                entitySchema.name,
                'Reference'
            )

            const groupRepresentativeAttributes: string[] = referenceSchema.referencedGroupTypeManaged
                ? await resolveRepresentativeAttributes(this.evitaClient, catalogName, referenceSchema.referencedGroupType as string)
                : []

            const facetRepresentativeAttributes: string[] = await resolveRepresentativeAttributes(
                this.evitaClient,
                catalogName,
                referenceSchema.entityType as string
            )

            const rawGroups = referenceSummaryResult[referenceName]
            const groupsArray = rawGroups instanceof Array ? rawGroups : [rawGroups]

            const groups: VisualisedReferenceGroup[] = groupsArray.map((groupResult: GraphQLResultNode) => {
                const groupStatistics = this.resolveGroupStatistics(groupResult, groupRepresentativeAttributes)
                const facetStatisticsResults: GraphQLResultNode[] = groupResult['facetStatistics'] || []
                const facets = facetStatisticsResults.map((facetResult: GraphQLResultNode) =>
                    this.resolveFacetStatistics(result, facetResult, facetRepresentativeAttributes)
                )
                const histogramStatisticsResult = groupResult['histogramStatistics'] || {}
                const histograms: VisualisedHistogramStatistics[] = []
                for (const indexName of Object.keys(histogramStatisticsResult)) {
                    histograms.push(new VisualisedHistogramStatistics(
                        indexName,
                        VisualisedHistogram.fromJson(histogramStatisticsResult[indexName])
                    ))
                }
                return new VisualisedReferenceGroup(groupStatistics, ImmutableList(facets), ImmutableList(histograms))
            })

            references.push(new VisualisedReferenceStatistics(referenceSchema, ImmutableList(groups)))
        }

        return new VisualisedReferenceSummary(references)
    }

    private resolveGroupStatistics(groupStatisticsResult: GraphQLResultNode, groupRepresentativeAttributes: string[]): VisualisedReferenceGroupStatistics {
        const count: number | undefined = groupStatisticsResult['count']
        const groupEntityResult = groupStatisticsResult['groupEntity']
        if (!groupEntityResult) {
            return new VisualisedReferenceGroupStatistics(undefined, undefined, count)
        }
        const primaryKey: number | undefined = groupEntityResult['primaryKey']
        const title = this.resolveRepresentativeTitle(groupEntityResult, groupRepresentativeAttributes)
        return new VisualisedReferenceGroupStatistics(primaryKey, title, count)
    }

    private resolveFacetStatistics(queryResult: GraphQLResultNode, facetStatisticsResult: GraphQLResultNode, facetRepresentativeAttributes: string[]): VisualisedFacetStatistics {
        const facetEntityResult = facetStatisticsResult['facetEntity']
        const requested: boolean | undefined = facetStatisticsResult['requested']
        const primaryKey: number | undefined = facetEntityResult?.['primaryKey']
        const title = this.resolveRepresentativeTitle(facetEntityResult, facetRepresentativeAttributes)
        const numberOfEntities: number | undefined = queryResult['recordPage']?.['totalRecordCount'] ?? queryResult['recordStrip']?.['totalRecordCount']
        const impactResult = facetStatisticsResult['impact']
        const impactDifference = formatImpactDifference(impactResult?.['difference'])
        const impactMatchCount: number | undefined = impactResult?.['matchCount']
        const count: number | undefined = facetStatisticsResult['count']
        return new VisualisedFacetStatistics(requested, primaryKey, title, numberOfEntities, impactDifference, impactMatchCount, count)
    }

    private resolveRepresentativeTitle(entityResult: GraphQLResultNode | undefined, representativeAttributes: string[]): string | undefined {
        if (!entityResult) return undefined

        const possibleAttributes: { value: unknown; isRepresentative: boolean }[] = []
        const attributes = entityResult['attributes'] || {}
        for (const attributeName in attributes) {
            possibleAttributes.push({
                value: attributes[attributeName],
                isRepresentative: representativeAttributes.includes(attributeName)
            })
        }
        return buildRepresentativeTitle(possibleAttributes, toPrintableAttributeValue)
    }
}
