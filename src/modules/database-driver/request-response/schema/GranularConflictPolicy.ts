/**
 * Sub-entity refinement of entity-level conflict detection. Narrows conflict checking to a single part
 * of an entity, so two writes touching different parts of the same entity no longer conflict.
 *
 * Legal only when the coarse {@link ConflictPolicy} is {@link ConflictPolicy.Entity}.
 */
export enum GranularConflictPolicy {
    /**
     * Conflicts are detected on individual entity attributes.
     */
    EntityAttribute = 'entityAttribute',
    /**
     * Conflicts are detected on individual references.
     */
    Reference = 'reference',
    /**
     * Conflicts are detected on individual attributes of individual references.
     */
    ReferenceAttribute = 'referenceAttribute',
    /**
     * Conflicts are detected on individual associated data.
     */
    AssociatedData = 'associatedData',
    /**
     * Conflicts are detected on individual prices.
     */
    Price = 'price',
    /**
     * Conflicts are detected on the hierarchy placement of an entity.
     */
    Hierarchy = 'hierarchy'
}
