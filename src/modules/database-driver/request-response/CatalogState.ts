/**
 * State of active catalog, changes it's capabilities
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
}
