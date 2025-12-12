export class SetAttributeSchemaRepresentativeMutation {
    static readonly TYPE = 'setAttributeSchemaRepresentativeMutation' as const

    readonly name: string
    readonly representative: boolean

    constructor(name: string, nullable: boolean) {
        this.name = name
        this.representative = nullable
    }
}
