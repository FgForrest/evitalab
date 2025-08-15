import {
    LocalCatalogSchemaMutation
} from '@/modules/database-driver/request-response/cdc/LocalCatalogSchemaMutation.ts'

export class ModifyAttributeSchemaTypeMutation extends LocalCatalogSchemaMutation {
    readonly kind = 'modifyAttributeSchemaTypeMutation'
    readonly name: string
    readonly type: string
    readonly indexedDecimalPlaces: number

    constructor(name: string, type: string, indexedDecimalPlaces: number) {
        super()
        this.name = name
        this.type = type
        this.indexedDecimalPlaces = indexedDecimalPlaces
    }
}
