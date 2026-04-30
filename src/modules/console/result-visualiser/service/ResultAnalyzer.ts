import { AnalyzedResult } from '../model/AnalyzedResult'

/**
 * Analyzes a raw query result and produces metadata needed to render
 * the result visualiser UI (available queries, schemas, visualiser types).
 * Each query language (GraphQL, EvitaQL) provides its own implementation.
 */
export interface ResultAnalyzer<TRawResult = unknown> {
    /**
     * Whether the query language supports multiple queries in one execution.
     * Determines whether the query selector dropdown is shown.
     */
    supportsMultipleQueries(): boolean

    /**
     * Analyzes the raw query result in one go.
     * Resolves all schemas and available visualiser types upfront.
     */
    analyze(inputQuery: string, rawResult: TRawResult, catalogName: string): Promise<AnalyzedResult>
}
