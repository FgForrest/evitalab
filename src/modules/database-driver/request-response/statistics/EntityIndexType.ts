/**
 * Type of an entity index, as reported by the per-collection index summary and by an index browse. A catalog index
 * has no value here - the engine addresses those by scope alone.
 */
export enum EntityIndexType {
    /**
     * Index covering all entities of the collection.
     */
    Global = 'global',
    /**
     * Index covering entities that reference any entity of a particular referenced entity type.
     */
    ReferencedEntityType = 'referencedEntityType',
    /**
     * One index per referenced entity - normally the largest count by far, and expected.
     */
    ReferencedEntity = 'referencedEntity',
    /**
     * Index covering entities that reference any entity belonging to a particular group entity type.
     */
    ReferencedGroupEntityType = 'referencedGroupEntityType',
    /**
     * One index per referenced group entity.
     */
    ReferencedGroupEntity = 'referencedGroupEntity'
}
