/**
 * Why a cached value is being dropped. Decides whether the **persistent** (on-disk) copy of the value goes
 * with the in-memory one.
 *
 * The distinction cannot be derived from the invalidating method, because opposing intents share one: a
 * catalog schema is dropped both because it provably changed and because the whole client cache is being
 * reset. Every caller therefore has to state its intent explicitly — an unstated reason is a silent bug that
 * no test naturally catches (both variants "work", one of them just quietly destroys the offline copy).
 */
export enum CacheInvalidationReason {
    /**
     * We positively know the value changed or ceased to exist: a change-data-capture notification, a mutation
     * evitaLab performed itself, or an observed schema-version drift. The persisted copy is stale by the same
     * evidence and must go with it.
     */
    ChangeEvidence = 'changeEvidence',
    /**
     * The in-memory value is dropped for a reason unrelated to its content — a wholesale cache reset, a
     * reconnect, a "reload everything" user action. The persisted copy is deliberately **kept**: it is what
     * evitaLab serves while the server is unreachable, and reachability is exactly what such an invalidation
     * is uncertain about. Freshness is restored by the background revalidation of the next read instead.
     */
    MemoryOnly = 'memoryOnly'
}
