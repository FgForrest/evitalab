import {
    FacetSummaryVisualiserService
} from '@/modules/console/result-visualiser/service/FacetSummaryVisualiserService'
import { HierarchyVisualiserService } from '@/modules/console/result-visualiser/service/HierarchyVisualiserService'
import {
    AttributeHistogramsVisualiserService
} from '@/modules/console/result-visualiser/service/AttributeHistogramsVisualiserService'
import {
    PriceHistogramVisualiserService
} from '@/modules/console/result-visualiser/service/PriceHistogramVisualiserService'
import { Result } from '@/modules/console/result-visualiser/model/Result'
import { Connection } from '@/modules/connection/model/Connection'
import { VisualiserType } from '@/modules/console/result-visualiser/model/VisualiserType'
import { EntitySchema } from '@/modules/connection/model/schema/EntitySchema'
import { Value } from '@/modules/connection/model/Value'

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
    abstract getEntitySchemaForQuery(query: string, connection: Connection, catalogName: string): Promise<EntitySchema | undefined>

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

    abstract getAttributeHistogramsService(): AttributeHistogramsVisualiserService

    abstract getPriceHistogramService(): PriceHistogramVisualiserService

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
