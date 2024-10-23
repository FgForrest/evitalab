//TODO: Add documentation
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
