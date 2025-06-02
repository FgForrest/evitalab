import { EntityReference } from "./EntityReference";

/**
 * Pointer to {@link Entity} in the database. EntityReferenceWithParent is used to reference an entity without loading it into memory.
 * It also contains a reference to the parent entity, if any.
 */
export class EntityReferenceWithParent extends EntityReference
{
    readonly parentEntity: EntityReferenceWithParent | undefined

    constructor(entityType: string, primaryKey: number, version: number, parentEntity: EntityReferenceWithParent | undefined){
        super(entityType, primaryKey, version);
        this.parentEntity = parentEntity;
    }
}
