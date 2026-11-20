/**
 * Phase of query processing a {@link QueryTelemetry} step measures. Mirrors evitaDB's `QueryPhase`.
 *
 * The string values are the evitaDB phase names exactly as GraphQL and REST transfer them, so a flat GraphQL
 * telemetry list maps onto this enum without a lookup table, and the names can key i18n messages and colours.
 */
export enum QueryPhase {
    /** Entire query execution time. */
    Overall = 'OVERALL',
    /** Entire planning phase of the query execution. */
    Planning = 'PLANNING',
    /** Planning phase of the inner query execution. */
    PlanningNestedQuery = 'PLANNING_NESTED_QUERY',
    /** Determining which indexes should be used. */
    PlanningIndexUsage = 'PLANNING_INDEX_USAGE',
    /** Creating formula for filtering entities. */
    PlanningFilter = 'PLANNING_FILTER',
    /** Creating formula for nested query. */
    PlanningFilterNestedQuery = 'PLANNING_FILTER_NESTED_QUERY',
    /** Creating alternative formula for filtering entities. */
    PlanningFilterAlternative = 'PLANNING_FILTER_ALTERNATIVE',
    /** Creating formula for sorting result entities. */
    PlanningSort = 'PLANNING_SORT',
    /** Creating alternative formula for sorting result entities. */
    PlanningSortAlternative = 'PLANNING_SORT_ALTERNATIVE',
    /** Creating factories for requested extra results. */
    PlanningExtraResultFabrication = 'PLANNING_EXTRA_RESULT_FABRICATION',
    /** Creating factories for requested extra results based on alternative indexes. */
    PlanningExtraResultFabricationAlternative = 'PLANNING_EXTRA_RESULT_FABRICATION_ALTERNATIVE',
    /** Entire query execution phase. */
    Execution = 'EXECUTION',
    /** Prefetching entities that should be examined instead of consulting indexes. */
    ExecutionPrefetch = 'EXECUTION_PREFETCH',
    /** Computing entities that should be returned in output (filtering). */
    ExecutionFilter = 'EXECUTION_FILTER',
    /** Computing entities within nested query that should be returned in output (filtering). */
    ExecutionFilterNestedQuery = 'EXECUTION_FILTER_NESTED_QUERY',
    /** Sorting output entities and slicing requested page. */
    ExecutionSortAndSlice = 'EXECUTION_SORT_AND_SLICE',
    /** Fabricating requested extra results. */
    ExtraResultsFabrication = 'EXTRA_RESULTS_FABRICATION',
    /** Fabricating requested single extra result. */
    ExtraResultItemFabrication = 'EXTRA_RESULT_ITEM_FABRICATION',
    /** Fetching rich data from the storage based on computed entity primary keys. */
    Fetching = 'FETCHING',
    /** Fetching referenced entities and entity groups from the storage based on referenced primary keys. */
    FetchingReferences = 'FETCHING_REFERENCES',
    /** Fetching parent entities from the storage based on parent primary keys. */
    FetchingParents = 'FETCHING_PARENTS',
    /**
     * Aggregate phase covering orchestration of all referenced entity loads (predicate setup, ID collection,
     * deduplication, recursive dispatch).
     */
    FetchingReferenceBodies = 'FETCHING_REFERENCE_BODIES'
}

const queryPhasesByName: ReadonlyMap<string, QueryPhase> = new Map(
    Object.values(QueryPhase).map(phase => [phase as string, phase])
)

/**
 * Resolves a phase from its evitaDB name (`'PLANNING_FILTER'`), or returns `undefined` for a name this version of
 * evitaLab does not know - a newer server may add phases.
 */
export function queryPhaseFromName(name: string): QueryPhase | undefined {
    return queryPhasesByName.get(name)
}
