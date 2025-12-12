export class RemoveAttributeSchemaMutation {
    static readonly TYPE = 'removeAttributeSchemaMutation' as const

    readonly name: string

    constructor(name: string) {
        this.name = name
    }
}
