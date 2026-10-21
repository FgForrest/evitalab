import type { SymbolSearchResult } from '@/modules/symbol-search/model/SymbolSearchResult'

/**
 * Ordered results of a query, cut to the number of rows the popup renders.
 */
export class SymbolSearchResults {
    /** the best results, at most the render limit */
    readonly results: SymbolSearchResult[]
    /** number of all symbols that matched */
    readonly totalCount: number

    constructor(results: SymbolSearchResult[], totalCount: number) {
        this.results = results
        this.totalCount = totalCount
    }

    static empty(): SymbolSearchResults {
        return new SymbolSearchResults([], 0)
    }
}
