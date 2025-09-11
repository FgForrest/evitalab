export class ModifyAttributeSchemaTypeMutation {
    readonly name: string
    readonly type: any
    readonly indexedDecimalPlaces: number


    constructor(name: string, type: any, indexedDecimalPlaces: number) {
        this.name = name
        this.type = type
        this.indexedDecimalPlaces = indexedDecimalPlaces
    }
}
