/**
 * List of all possible traffic recording types.
 */
export enum TrafficRecordType {
    /**
     * evitaDB session opened.
     */
    SessionStart = 'sessionStart',
    /**
     * evitaDB session closed.
     */
    SessionClose = 'sessionClose',
    /**
     * Query received via. API from the client - container contains original string of the client query.
     * API might call multiple queries related to the same source query.
     */
    SourceQuery = 'sourceQuery',
    /**
     * Query received via. API from the client is finalized and sent to the client. Container contains the final
     * statistics aggregated over all operations related to the source query.
     */
    SourceQueryStatistics = 'sourceQueryStatistics',
    /**
     * Internal evitaDB query (evitaQL) was executed.
     */
    Query = 'query',
    /**
     * Internal call to retrieve single evitaDB entity. Record is not created for entities fetched as a part of
     * a query.
     */
    Fetch = 'fetch',
    /**
     * Internal call to enrich contents of the evitaDB entity.
     */
    Enrichment = 'enrichment',
    /**
     * Internal call to mutate the evitaDB entity or catalog schema.
     */
    Mutation = 'mutation'
}
