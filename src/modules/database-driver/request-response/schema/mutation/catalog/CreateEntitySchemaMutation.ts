export class CreateEntitySchemaMutation {
    readonly entityType: string

    constructor(entityType: string) {
        this.entityType = entityType
    }
}
