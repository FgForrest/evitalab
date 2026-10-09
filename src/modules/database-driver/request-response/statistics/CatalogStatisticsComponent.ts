/**
 * Independently selectable part of a catalog (or entity collection) statistics snapshot. The client asks for exactly
 * the components it needs, which is what keeps a cheap polled refresh apart from an expensive drill-down.
 */
export enum CatalogStatisticsComponent {
    /**
     * Catalog id, name, state, version and the read-only/unusable flags. Always delivered, requested or not.
     */
    Identity = 'identity',
    /**
     * Total / live / archived entity counts.
     */
    RecordCounts = 'recordCounts',
    /**
     * At catalog level the inventory of entity collections (carrying no statistics); at collection level the header
     * counters of the named collection.
     */
    Collections = 'collections',
    /**
     * Sessions currently open against the catalog. Catalog level only.
     */
    Sessions = 'sessions',
    /**
     * The four commit pipeline version watermarks. Catalog level only.
     */
    CommitPipeline = 'commitPipeline',
    /**
     * Transaction, mutation and write-ahead log counters with their short-window rates. Catalog level only.
     */
    Activity = 'activity',
    /**
     * Disk footprint split into the classes that have different remedies.
     */
    StorageSize = 'storageSize',
    /**
     * Storage-part histogram - where the bytes go, per storage-part type.
     */
    StorageComposition = 'storageComposition',
    /**
     * Active record share and whether the data store already satisfies the compaction predicate.
     */
    Fragmentation = 'fragmentation',
    /**
     * Time-travel window, retained write-ahead log files and the awaiting-deletion split. Catalog level only.
     */
    History = 'history',
    /**
     * Checkpoint cadence, fence depth and files forced. Catalog level only.
     */
    Durability = 'durability',
    /**
     * Index counts - a plain total at catalog level, the breakdown by type and scope at collection level.
     */
    IndexSummary = 'indexSummary',
    /**
     * Distinct values and records covered per index. Expensive at collection level - never polled.
     */
    IndexCardinality = 'indexCardinality',
    /**
     * Pending (not yet flushed) state and the in-memory history retained for long-running sessions.
     */
    VolatileState = 'volatileState'
}
