import { List as ImmutableList } from 'immutable'
import type { FacetSummaryResultParser } from '@/modules/console/result-visualiser/service/FacetSummaryResultParser'
import { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'
import {
    VisualisedFacetGroup,
    VisualisedFacetSummary,
    VisualisedReferenceFacets
} from '@/modules/console/result-visualiser/model/facet-summary/VisualisedFacetSummary'
import { VisualisedFacetGroupStatistics } from '@/modules/console/result-visualiser/model/facet-summary/VisualisedFacetGroupStatistics'
import { VisualisedFacetStatistics } from '@/modules/console/result-visualiser/model/facet-summary/VisualisedFacetStatistics'
import { EvitaClient } from '@/modules/database-driver/EvitaClient'
import { findSchemaByName } from '@/modules/console/result-visualiser/service/utils/schemaMatching'
import { resolveRepresentativeAttributes } from '@/modules/console/result-visualiser/service/utils/representativeAttributes'
import { formatImpactDifference } from '@/modules/console/result-visualiser/service/utils/impactFormatting'
import type { RestResultNode } from '@/modules/rest-console/console/result-visualiser/model/RestResultNode'
import { resolveRestRepresentativeTitle } from '@/modules/rest-console/console/result-visualiser/service/restRepresentativeTitle'

/**
 * {@link FacetSummaryResultParser} for the REST API. `facetSummary` is keyed by the camelCase reference name; a
 * reference without groups is a single object, a grouped one a list of groups.
 */
export class RestFacetSummaryResultParser implements FacetSummaryResultParser {

    private readonly evitaClient: EvitaClient

    constructor(evitaClient: EvitaClient) {
        this.evitaClient = evitaClient
    }

    async parse(queryResult: unknown, entitySchema: EntitySchema, catalogName: string): Promise<VisualisedFacetSummary> {
        const result: RestResultNode = queryResult as RestResultNode
        const facetSummaryResult: RestResultNode | undefined = result['extraResults']?.['facetSummary']
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
            const facetRepresentativeAttributes: string[] = referenceSchema.referencedEntityTypeManaged
                ? await resolveRepresentativeAttributes(this.evitaClient, catalogName, referenceSchema.entityType as string)
                : []

            const rawGroups: unknown = facetSummaryResult[referenceName]
            const groupsArray: RestResultNode[] = Array.isArray(rawGroups) ? rawGroups : [rawGroups as RestResultNode]
            const groups: VisualisedFacetGroup[] = groupsArray.map((groupResult: RestResultNode) => {
                const facetStatisticsResults: RestResultNode[] = groupResult['facetStatistics'] ?? []
                return new VisualisedFacetGroup(
                    this.resolveGroupStatistics(groupResult, groupRepresentativeAttributes),
                    ImmutableList(facetStatisticsResults.map(facetResult =>
                        this.resolveFacetStatistics(result, facetResult, facetRepresentativeAttributes)
                    ))
                )
            })
            references.push(new VisualisedReferenceFacets(referenceSchema, ImmutableList(groups)))
        }
        return new VisualisedFacetSummary(references)
    }

    private resolveGroupStatistics(groupResult: RestResultNode, representativeAttributes: string[]): VisualisedFacetGroupStatistics {
        const count: number | undefined = groupResult['count']
        const groupEntityResult: RestResultNode | undefined = groupResult['groupEntity']
        if (!groupEntityResult) {
            return new VisualisedFacetGroupStatistics(undefined, undefined, count)
        }
        return new VisualisedFacetGroupStatistics(
            groupEntityResult['primaryKey'],
            resolveRestRepresentativeTitle(groupEntityResult, representativeAttributes),
            count
        )
    }

    private resolveFacetStatistics(queryResult: RestResultNode,
                                   facetResult: RestResultNode,
                                   representativeAttributes: string[]): VisualisedFacetStatistics {
        const facetEntityResult: RestResultNode | undefined = facetResult['facetEntity']
        const impactResult: RestResultNode | undefined = facetResult['impact']
        return new VisualisedFacetStatistics(
            facetResult['requested'],
            facetEntityResult?.['primaryKey'],
            resolveRestRepresentativeTitle(facetEntityResult, representativeAttributes),
            queryResult['recordPage']?.['totalRecordCount'] ?? queryResult['recordStrip']?.['totalRecordCount'],
            formatImpactDifference(impactResult?.['difference']),
            impactResult?.['matchCount'],
            facetResult['count']
        )
    }
}
