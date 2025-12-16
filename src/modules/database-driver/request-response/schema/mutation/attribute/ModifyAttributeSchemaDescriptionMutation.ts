export class ModifyAttributeSchemaDescriptionMutation {
    static readonly TYPE = 'modifyAttributeSchemaDescriptionMutation' as const

    readonly name: string
    readonly description: string|undefined

    constructor(name: string, description: string|undefined) {
        this.name = name
        this.description = description
    }
}
