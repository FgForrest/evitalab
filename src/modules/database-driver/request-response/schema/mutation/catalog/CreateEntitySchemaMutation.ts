export class CreateEntitySchemaMutation {
    static readonly TYPE = 'createEntitySchemaMutation' as const

    readonly entityType: string

    constructor(entityType: string) {
        this.entityType = entityType
    }
}
