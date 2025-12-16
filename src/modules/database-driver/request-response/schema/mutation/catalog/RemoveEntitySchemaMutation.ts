export class RemoveEntitySchemaMutation {
    static readonly TYPE = 'removeEntitySchemaMutation' as const

    readonly name: string

    constructor(name: string) {
        this.name = name;
    }
}
