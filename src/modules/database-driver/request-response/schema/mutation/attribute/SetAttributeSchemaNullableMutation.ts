export class SetAttributeSchemaNullableMutation {
    static readonly TYPE = 'setAttributeSchemaNullableMutation' as const

    readonly name: string
    readonly nullable: boolean

    constructor(name: string, nullable: boolean) {
        this.name = name
        this.nullable = nullable
    }
}
