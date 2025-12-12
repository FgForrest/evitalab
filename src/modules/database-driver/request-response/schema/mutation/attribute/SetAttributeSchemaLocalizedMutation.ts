export class SetAttributeSchemaLocalizedMutation {
    static readonly TYPE = 'setAttributeSchemaLocalizedMutation' as const

    readonly name: string
    readonly localized: boolean

    constructor(name: string, localized: boolean) {
        this.name = name
        this.localized = localized
    }
}
