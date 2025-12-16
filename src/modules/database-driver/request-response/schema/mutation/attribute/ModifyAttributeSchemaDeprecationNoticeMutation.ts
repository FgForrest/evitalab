export class ModifyAttributeSchemaDeprecationNoticeMutation {
    static readonly TYPE = 'modifyAttributeSchemaDeprecationNoticeMutation' as const

    readonly name: string
    readonly deprecationNotice: string|undefined

    constructor(name: string, deprecationNotice: string|undefined) {
        this.name = name
        this.deprecationNotice = deprecationNotice
    }
}
