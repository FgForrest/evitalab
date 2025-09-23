export class MutationHistoryRequest {
    readonly entityPrimaryKey?: number|undefined
    readonly entityType?: string|undefined


    constructor(entityPrimaryKey: number | undefined, entityType: string | undefined) {
        this.entityPrimaryKey = entityPrimaryKey
        this.entityType = entityType
    }
}
