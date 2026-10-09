/**
 * What an index browse ranks its results by before the page is cut.
 */
export enum IndexBrowseOrdering {
    /**
     * The order the indexes sit in inside the collection's internal index map. Arbitrary but stable for a catalog
     * version, the cheapest way to page exhaustively, and the only ordering with no paging-depth limit. Accepted
     * with ascending direction only.
     */
    MapOrder = 'mapOrder',
    /**
     * Entity count. Degenerates to map order for a catalog browse, which reports no entity count.
     */
    EntityCount = 'entityCount',
    /**
     * How many executed query plans chose the index.
     */
    QueryCount = 'queryCount',
    /**
     * How many entity mutations acquired the index for modification.
     */
    UpdateCount = 'updateCount'
}
