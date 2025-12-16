export class ModifyAttributeSchemaNameMutation {
    static readonly TYPE = 'modifyAttributeSchemaNameMutation' as const

    readonly name: string
    readonly newName: string

    constructor(name: string, newName: string) {
        this.name = name
        this.newName = newName
    }
}
