import { List as ImmutableList } from 'immutable'
import type { ReferenceSummaryResultParser } from '@/modules/console/result-visualiser/service/ReferenceSummaryResultParser'
import { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'
import {
    VisualisedReferenceGroup,
    VisualisedReferenceStatistics,
    VisualisedReferenceSummary
} from '@/modules/console/result-visualiser/model/reference-summary/VisualisedReferenceSummary'
import { VisualisedReferenceGroupStatistics } from '@/modules/console/result-visualiser/model/reference-summary/VisualisedReferenceGroupStatistics'
import { VisualisedFacetStatistics } from '@/modules/console/result-visualiser/model/reference-summary/VisualisedFacetStatistics'
import { VisualisedHistogramStatistics } from '@/modules/console/result-visualiser/model/reference-summary/VisualisedHistogramStatistics'
import { VisualisedHistogram } from '@/modules/console/result-visualiser/model/histogram/VisualisedHistogram'
import { EvitaClient } from '@/modules/database-driver/EvitaClient'
import { findSchemaByName } from '@/modules/console/result-visualiser/service/utils/schemaMatching'
import { resolveRepresentativeAttributes } from '@/modules/console/result-visualiser/service/utils/representativeAttributes'
import { formatImpactDifference } from '@/modules/console/result-visualiser/service/utils/impactFormatting'
import type { RestResultNode } from '@/modules/rest-console/console/result-visualiser/model/RestResultNode'
import { resolveRestRepresentativeTitle } from '@/modules/rest-console/console/result-visualiser/service/restRepresentativeTitle'

/**
 * {@link ReferenceSummaryResultParser} for the REST API. Same shape as the facet summary, plus optional
 * `histogramStatistics` per group keyed by index name.
 */
export class RestReferenceSummaryResultParser implements ReferenceSummaryResultParser {

    private readonly evitaClient: EvitaClient

    constructor(evitaClient: EvitaClient) {
        this.evitaClient = evitaClient
    }

    async parse(queryResult: unknown, entitySchema: EntitySchema, catalogName: string): Promise<VisualisedReferenceSummary> {
        const result: RestResultNode = queryResult as RestResultNode
        const referenceSummaryResult: RestResultNode | undefined = result['extraResults']?.['referenceSummary']
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
            const facetRepresentativeAttributes: string[] = referenceSchema.referencedEntityTypeManaged
                ? await resolveRepresentativeAttributes(this.evitaClient, catalogName, referenceSchema.entityType as string)
                : []

            const rawGroups: unknown = referenceSummaryResult[referenceName]
            const groupsArray: RestResultNode[] = Array.isArray(rawGroups) ? rawGroups : [rawGroups as RestResultNode]
            const groups: VisualisedReferenceGroup[] = groupsArray.map((groupResult: RestResultNode) => {
                const facetStatisticsResults: RestResultNode[] = groupResult['facetStatistics'] ?? []
                const histogramStatisticsResult: RestResultNode = groupResult['histogramStatistics'] ?? {}
                const histograms: VisualisedHistogramStatistics[] = Object.keys(histogramStatisticsResult)
                    .map(indexName => new VisualisedHistogramStatistics(
                        indexName,
                        VisualisedHistogram.fromJson(histogramStatisticsResult[indexName])
                    ))
                return new VisualisedReferenceGroup(
                    this.resolveGroupStatistics(groupResult, groupRepresentativeAttributes),
                    ImmutableList(facetStatisticsResults.map(facetResult =>
                        this.resolveFacetStatistics(result, facetResult, facetRepresentativeAttributes)
                    )),
                    ImmutableList(histograms)
                )
            })
            references.push(new VisualisedReferenceStatistics(referenceSchema, ImmutableList(groups)))
        }
        return new VisualisedReferenceSummary(references)
    }

    private resolveGroupStatistics(groupResult: RestResultNode, representativeAttributes: string[]): VisualisedReferenceGroupStatistics {
        const count: number | undefined = groupResult['count']
        const groupEntityResult: RestResultNode | undefined = groupResult['groupEntity']
        if (!groupEntityResult) {
            return new VisualisedReferenceGroupStatistics(undefined, undefined, count)
        }
        return new VisualisedReferenceGroupStatistics(
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
