import {
    Result,
    VisualisedFacetGroupStatistics, VisualisedFacetStatistics, VisualisedNamedHierarchy,
    VisualiserType,
    VisualiserTypeType
} from '@/model/editor/result-visualiser'
import {
    FacetSummaryVisualiserService, HierarchyVisualiserService,
    ResultVisualiserService
} from '@/services/editor/result-visualiser/result-visualiser.service'
import { EntitySchema, ReferenceSchema } from '@/model/evitadb'
import { UnexpectedError } from '@/model/lab'

/**
 * Common abstract for all JSON-based result visualiser services.
 */
export abstract class JsonResultVisualiserService extends ResultVisualiserService {

    protected readonly genericEntityType: string = 'entity'

    /**
     * Resolves human-readable string representation of an entity.
     */
    abstract resolveRepresentativeTitleForEntityResult(entityResult: Result | undefined, representativeAttributes: string[]): string | undefined

    findVisualiserTypes(queryResult: Result): VisualiserType[] {
        const visualiserTypes: VisualiserType[] = []

        const extraResults = queryResult['extraResults']
        if (extraResults) {
            if (extraResults['facetSummary']) {
                visualiserTypes.push({
                    title: 'Facet summary',
                    value: VisualiserTypeType.FacetSummary
                })
            }
            if (extraResults['hierarchy']) {
                visualiserTypes.push({
                    title: 'Hierarchy',
                    value: VisualiserTypeType.Hierarchy
                })
            }
        }

        return visualiserTypes
    }

    findResultForVisualiser(queryResult: Result, visualiserType: string): Result | undefined {
        switch (visualiserType) {
            case VisualiserTypeType.FacetSummary:
                return queryResult?.['extraResults']?.['facetSummary']
            case VisualiserTypeType.Hierarchy:
                return queryResult?.['extraResults']?.['hierarchy']
            default:
                return undefined
        }
    }
}

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
            const referenceSchema: ReferenceSchema | undefined = Object.values(entitySchema.references)
                .find(reference => reference.nameVariants.camelCase === referenceName)
            if (referenceSchema == undefined) {
                throw new UnexpectedError(undefined, `Reference '${referenceName}' not found in entity '${entitySchema.name}'.`)
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

        return { primaryKey, title, count }
    }

    findFacetStatisticsResults(groupStatisticsResult: Result): Result[] {
        return groupStatisticsResult['facetStatistics'] || []
    }

    resolveFacetStatistics(queryResult: Result, facetStatisticsResult: Result, facetRepresentativeAttributes: string[]): VisualisedFacetStatistics {
        const facetEntityResult: Result | undefined = facetStatisticsResult['facetEntity']

        const requested: boolean | undefined = facetStatisticsResult['requested']

        const primaryKey: number | undefined = facetEntityResult?.['primaryKey']
        const title : string | undefined = this.visualiserService.resolveRepresentativeTitleForEntityResult(
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

        return { requested, primaryKey, title, numberOfEntities, impactDifference, impactMatchCount, count }
    }
}

/**
 * Common abstract for all JSON-based hierarchy visualiser services.
 */
export abstract class JsonHierarchyVisualiserService<VS extends JsonResultVisualiserService> implements HierarchyVisualiserService {
    protected readonly visualiserService: VS

    protected constructor(visualiserService: VS) {
        this.visualiserService = visualiserService
    }

    findNamedHierarchiesByReferencesResults(hierarchyResult: Result, entitySchema: EntitySchema): [(ReferenceSchema | undefined), Result][] {
        const referencesWithHierarchies: [ReferenceSchema | undefined, Result][] = []
        for (const referenceName of Object.keys(hierarchyResult)) {
            const namedHierarchiesResult: Result = hierarchyResult[referenceName]
            if (referenceName === 'self') {
                referencesWithHierarchies.push([undefined, namedHierarchiesResult])
            } else {
                const referenceSchema: ReferenceSchema | undefined = Object.values(entitySchema.references)
                    .find(reference => reference.nameVariants.camelCase === referenceName)
                if (referenceSchema == undefined) {
                    throw new UnexpectedError(undefined, `Reference '${referenceName}' not found in entity '${entitySchema.name}'.`)
                }
                referencesWithHierarchies.push([referenceSchema, namedHierarchiesResult])
            }
        }
        return referencesWithHierarchies
    }

    abstract resolveNamedHierarchy(namedHierarchyResult: Result[], entityRepresentativeAttributes: string[]): VisualisedNamedHierarchy
}
