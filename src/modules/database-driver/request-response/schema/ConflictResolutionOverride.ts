/**
 * Per-item refinement of the conflict resolution resolved for the owning entity. Declared on an
 * individual attribute, associated data or reference schema.
 *
 * Takes effect only when the entity's effective coarse policy is `ConflictPolicy.Entity`.
 */
export enum ConflictResolutionOverride {
    /**
     * No explicit override - the item follows the conflict resolution resolved for its entity.
     */
    Inherited = 'inherited',
    /**
     * Conflicts on this item are detected at the granular (sub-entity) level, i.e. only writes changing
     * this very item conflict with each other.
     */
    Granular = 'granular',
    /**
     * Conflicts on this item are detected at the whole-entity level, even when the rest of the entity
     * uses finer per-part checks.
     */
    Entity = 'entity'
}
