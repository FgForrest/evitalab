/**
 * How many indexes the catalog holds in total, including the catalog-level index itself. The breakdown by type and
 * scope requires a pass over one collection's index keys and is fetched per collection instead.
 */
export class IndexSummaryStatistics {

    readonly totalIndexCount: bigint

    constructor(totalIndexCount: bigint) {
        this.totalIndexCount = totalIndexCount
    }
}
