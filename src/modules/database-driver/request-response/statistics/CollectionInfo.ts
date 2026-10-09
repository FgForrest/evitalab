/**
 * Identification of a single entity collection - what to pass to a collection-level statistics call.
 */
export class CollectionInfo {

    readonly entityType: string
    readonly entityTypePrimaryKey: number

    constructor(entityType: string, entityTypePrimaryKey: number) {
        this.entityType = entityType
        this.entityTypePrimaryKey = entityTypePrimaryKey
    }
}
