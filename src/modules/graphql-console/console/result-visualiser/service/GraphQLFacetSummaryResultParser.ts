import type { FacetSummaryResultParser } from '@/modules/console/result-visualiser/service/FacetSummaryResultParser'
import type { GraphQLResultNode } from '@/modules/database-driver/connector/gql/model/GraphQLResultNode'
import { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'
import {
    VisualisedFacetSummary,
    VisualisedReferenceFacets,
    VisualisedFacetGroup
} from '@/modules/console/result-visualiser/model/facet-summary/VisualisedFacetSummary'
import { VisualisedFacetGroupStatistics } from '@/modules/console/result-visualiser/model/facet-summary/VisualisedFacetGroupStatistics'
import { VisualisedFacetStatistics } from '@/modules/console/result-visualiser/model/facet-summary/VisualisedFacetStatistics'
import { EvitaClient } from '@/modules/database-driver/EvitaClient'
import { findSchemaByName } from '@/modules/console/result-visualiser/service/utils/schemaMatching'
import { resolveRepresentativeAttributes } from '@/modules/console/result-visualiser/service/utils/representativeAttributes'
import { buildRepresentativeTitle, toPrintableAttributeValue } from '@/modules/console/result-visualiser/service/utils/representativeTitle'
import { formatImpactDifference } from '@/modules/console/result-visualiser/service/utils/impactFormatting'

/**
 * {@link FacetSummaryResultParser} for GraphQL query language. Navigates JSON extra results
 * and resolves representative attributes for group and facet entities.
 */
export class GraphQLFacetSummaryResultParser implements FacetSummaryResultParser {

    private readonly evitaClient: EvitaClient

    constructor(evitaClient: EvitaClient) {
        this.evitaClient = evitaClient
    }

    async parse(queryResult: unknown, entitySchema: EntitySchema, catalogName: string): Promise<VisualisedFacetSummary> {
        const result = queryResult as GraphQLResultNode
        const facetSummaryResult = result['extraResults']?.['facetSummary']
        if (!facetSummaryResult) {
            return new VisualisedFacetSummary([])
        }

        const references: VisualisedReferenceFacets[] = []

        for (const referenceName of Object.keys(facetSummaryResult)) {
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

            const rawGroups = facetSummaryResult[referenceName]
            const groupsArray = rawGroups instanceof Array ? rawGroups : [rawGroups]

            const groups: VisualisedFacetGroup[] = groupsArray.map((groupResult: GraphQLResultNode) => {
                const groupStatistics = this.resolveGroupStatistics(groupResult, groupRepresentativeAttributes)
                const facetStatisticsResults: GraphQLResultNode[] = groupResult['facetStatistics'] || []
                const facets = facetStatisticsResults.map((facetResult: GraphQLResultNode) =>
                    this.resolveFacetStatistics(result, facetResult, facetRepresentativeAttributes)
                )
                return new VisualisedFacetGroup(groupStatistics, facets)
            })

            references.push(new VisualisedReferenceFacets(referenceSchema, groups))
        }

        return new VisualisedFacetSummary(references)
    }

    private resolveGroupStatistics(groupStatisticsResult: GraphQLResultNode, groupRepresentativeAttributes: string[]): VisualisedFacetGroupStatistics {
        const count: number | undefined = groupStatisticsResult['count']
        const groupEntityResult = groupStatisticsResult['groupEntity']
        if (!groupEntityResult) {
            return new VisualisedFacetGroupStatistics(undefined, undefined, count)
        }
        const primaryKey: number | undefined = groupEntityResult['primaryKey']
        const title = this.resolveRepresentativeTitle(groupEntityResult, groupRepresentativeAttributes)
        return new VisualisedFacetGroupStatistics(primaryKey, title, count)
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
