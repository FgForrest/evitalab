import { EntitySchema, ReferenceSchema } from '@/model/evitadb'
import {
    Result,
    VisualisedFacetGroupStatistics,
    VisualisedFacetStatistics,
    VisualisedNamedHierarchy, VisualiserType
} from '@/model/editor/result-visualiser'
import { EvitaDBConnection } from '@/model/lab'

/**
 * Service for visualising raw JSON results from query executions of specific query language into interactive GUI.
 */
export abstract class ResultVisualiserService {

    /**
     * Whether the query language supports multiple queries in one query execution.
     */
    abstract supportsMultipleQueries(): boolean

    /**
     * Tries to find queries in the root result.
     */
    abstract findQueries(inputQuery: string, result: Result): string[]
    /**
     * Tries to find query result in the root result by selected query name.
     */
    abstract findQueryResult(result: Result, query: string): Result | undefined
    /**
     * Returns entity schema for selected query.
     */
    abstract getEntitySchemaForQuery(query: string, connection: EvitaDBConnection, catalogName: string): Promise<EntitySchema | undefined>

    /**
     * Tries to find result-result-visualiser types in the root result.
     */
    abstract findVisualiserTypes(queryResult: Result): VisualiserType[]
    /**
     * Tries to find result-result-visualiser result in the root result by selected result-result-visualiser type.
     */
    abstract findResultForVisualiser(queryResult: Result, visualiserType: string): Result | undefined

    abstract getFacetSummaryService(): FacetSummaryVisualiserService
    abstract getHierarchyService(): HierarchyVisualiserService

    // todo lho refactor into common function
    toPrintableAttributeValue(attributeValue: any): string | undefined {
        if (attributeValue == undefined) {
            return undefined
        }
        if (attributeValue instanceof Array) {
            if (attributeValue.length === 0) {
                return undefined
            }
            return `[${attributeValue.map(it => this.toPrintableAttributeValue(it)).join(', ')}]`
        } else if (attributeValue instanceof Object) {
            return JSON.stringify(attributeValue)
        } else {
            return attributeValue.toString()
        }
    }
}

/**
 * Service for visualising raw JSON facet summary results.
 */
export interface FacetSummaryVisualiserService {
    /**
     * Tries to find references with group statistics results in the facet summary result.
     */
    findFacetGroupStatisticsByReferencesResults(facetSummaryResult: Result, entitySchema: EntitySchema): [ReferenceSchema, Result[]][]
    /**
     * Resolves visualisable facet group statistics from the facet group statistics result.
     */
    resolveFacetGroupStatistics(groupStatisticsResult: Result, groupRepresentativeAttributes: string[]): VisualisedFacetGroupStatistics

    /**
     * Tries to find facet statistics results in the facet group statistics result.
     */
    findFacetStatisticsResults(groupStatisticsResult: Result): Result[]
    /**
     * Resolves visualisable facet statistics from the facet statistics result.
     */
    resolveFacetStatistics(queryResult: Result, facetStatisticsResult: Result, facetRepresentativeAttributes: string[]): VisualisedFacetStatistics
}

/**
 * Service for visualising raw JSON hierarchies.
 */
export interface HierarchyVisualiserService {
    /**
     * Tries to find references with named hierarchies results in the hierarchy result.
     */
    findNamedHierarchiesByReferencesResults(hierarchyResult: Result, entitySchema: EntitySchema): [ReferenceSchema | undefined, Result][]

    /**
     * Resolves visualisable named hierarchy from the named hierarchy result.
     */
    resolveNamedHierarchy(namedHierarchyResult: Result[], entityRepresentativeAttributes: string[]): VisualisedNamedHierarchy
}

