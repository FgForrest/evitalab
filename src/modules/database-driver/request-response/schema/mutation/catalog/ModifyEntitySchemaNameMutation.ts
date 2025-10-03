export class ModifyEntitySchemaNameMutation {
    readonly name: string
    readonly newName: string
    readonly overwriteTarget: boolean

    constructor(name: string, newName: string, overwriteTarget: boolean) {
        this.name = name;
        this.newName = newName;
        this.overwriteTarget = overwriteTarget;
    }
}
