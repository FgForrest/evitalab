/**
 * Coarse, mutually exclusive scope at which evitaDB detects write conflicts between two concurrent
 * transactions. The wider the scope, the more concurrent writes are rejected and must be retried.
 *
 * Declared on a catalog schema and on an entity schema; the most specific declaration wins outright.
 */
export enum ConflictPolicy {
    /**
     * No conflict detection is performed - concurrent changes are never rejected and the last writer wins.
     */
    None = 'none',
    /**
     * Two writes conflict when they change anything in the catalog, even unrelated entities.
     */
    Catalog = 'catalog',
    /**
     * Two writes conflict when they change any entity of the same type.
     */
    Collection = 'collection',
    /**
     * Two writes conflict only when they change the same entity. The only scope that can be further
     * narrowed by {@link GranularConflictPolicy} refinements.
     */
    Entity = 'entity'
}
