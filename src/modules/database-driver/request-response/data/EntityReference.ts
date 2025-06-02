/**
 * Pointer to {@link Entity} in the database. EntityReference is used to reference an entity without loading it into memory.
 */
export class EntityReference {
    readonly entityType: string
    readonly primaryKey: number
    readonly version: number

    constructor(entityType: string, primaryKey: number, version: number){
        this.entityType = entityType;
        this.primaryKey = primaryKey;
        this.version = version;
    }
}
