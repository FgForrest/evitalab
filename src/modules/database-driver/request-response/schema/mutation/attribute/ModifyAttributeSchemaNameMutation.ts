export class ModifyAttributeSchemaNameMutation {
    readonly name: string
    readonly newName: string

    constructor(name: string, newName: string) {
        this.name = name
        this.newName = newName
    }
}
