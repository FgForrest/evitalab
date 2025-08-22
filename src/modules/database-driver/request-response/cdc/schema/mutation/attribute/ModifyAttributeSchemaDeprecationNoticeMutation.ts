export class ModifyAttributeSchemaDeprecationNoticeMutation {
    readonly name: string
    readonly deprecationNotice: string

    constructor(name: string, deprecationNotice: string) {
        this.name = name
        this.deprecationNotice = deprecationNotice
    }
}
