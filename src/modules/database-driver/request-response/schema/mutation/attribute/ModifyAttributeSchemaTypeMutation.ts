import type { Scalar } from '@/modules/database-driver/data-type/Scalar'
export class ModifyAttributeSchemaTypeMutation {
    static readonly TYPE = 'modifyAttributeSchemaTypeMutation' as const

    readonly name: string
    readonly type: Scalar
    readonly indexedDecimalPlaces: number


    constructor(name: string, type: Scalar, indexedDecimalPlaces: number) {
        this.name = name
        this.type = type
        this.indexedDecimalPlaces = indexedDecimalPlaces
    }
}
