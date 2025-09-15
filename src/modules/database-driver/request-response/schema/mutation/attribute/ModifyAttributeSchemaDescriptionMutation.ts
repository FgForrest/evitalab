export class ModifyAttributeSchemaDescriptionMutation {
    readonly name: string
    readonly description: string|undefined

    constructor(name: string, description: string|undefined) {
        this.name = name
        this.description = description
    }
}
