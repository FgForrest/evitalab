import { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'
import { VisualiserType } from './VisualiserType'

/**
 * Result of analyzing a raw query output. Contains all metadata needed
 * by {@link ResultVisualiser} to render query/type selectors and invoke parsers.
 */
export class AnalyzedResult {
    readonly queries: AnalyzedQuery[]

    constructor(queries: AnalyzedQuery[]) {
        this.queries = queries
    }
}

/**
 * A single analyzed query within the result. Carries the pre-fetched entity schema,
 * available visualiser types, and the query-level result slice for parsers.
 */
export class AnalyzedQuery {
    readonly name: string
    readonly entitySchema: EntitySchema | undefined
    readonly visualiserTypes: VisualiserType[]
    /** Query-level result slice passed opaquely to parsers. */
    readonly queryResult: unknown

    constructor(
        name: string,
        entitySchema: EntitySchema | undefined,
        visualiserTypes: VisualiserType[],
        queryResult: unknown
    ) {
        this.name = name
        this.entitySchema = entitySchema
        this.visualiserTypes = visualiserTypes
        this.queryResult = queryResult
    }
}
