import { EntityReference } from "./EntityReference";

//TODO: Add documentation
export class EntityReferenceWithParent extends EntityReference
{
    readonly parentEntity: EntityReferenceWithParent | undefined

    constructor(entityType: string, primaryKey: number, version: number, parentEntity: EntityReferenceWithParent | undefined){
        super(entityType, primaryKey, version);
        this.parentEntity = parentEntity;
    }
}
