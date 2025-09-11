export class SetAttributeSchemaNullableMutation {
    readonly name: string
    readonly nullable: boolean

    constructor(name: string, nullable: boolean) {
        this.name = name
        this.nullable = nullable
    }
}
