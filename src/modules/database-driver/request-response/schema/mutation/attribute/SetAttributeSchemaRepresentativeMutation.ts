export class SetAttributeSchemaRepresentativeMutation {
    readonly name: string
    readonly representative: boolean

    constructor(name: string, nullable: boolean) {
        this.name = name
        this.representative = nullable
    }
}
