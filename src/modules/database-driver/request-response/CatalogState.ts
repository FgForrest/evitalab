/**
 * State of active catalog, changes it's capabilities.
 *
 * The string values feed the `explorer.catalog.flag.<value>` i18n key pattern used by the
 * connection explorer.
 */
export enum CatalogState {
    Unknown = 'unknown',
    WarmingUp = 'warmingUp',
    Alive = 'alive',
    BeingActivated = 'beingActivated',
    BeingCreated = 'beingCreated',
    BeingDeactivated = 'beingDeactivated',
    BeingDeleted = 'beingDeleted',
    Corrupted = 'corrupted',
    GoingAlive = 'goingAlive',
    Inactive = 'inactive',
    /**
     * The catalog was previously registered with the engine but its on-disk folder is no longer
     * present. Tracked non-destructively; may recover to {@link Inactive} once the folder reappears.
     */
    Missing = 'missing',
    /**
     * The catalog's on-disk storage protocol is older than the engine supports. Reads and writes are
     * refused until the catalog has been upgraded.
     */
    OutOfDate = 'outOfDate',
    /**
     * Transient state entered while the catalog's storage protocol is being upgraded; the catalog
     * returns to its prior operational state once the upgrade completes.
     */
    BeingUpgraded = 'beingUpgraded',
}
