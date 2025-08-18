import {
    LocalCatalogSchemaMutation
} from '@/modules/database-driver/request-response/cdc/LocalCatalogSchemaMutation.ts'

export class ModifyAttributeSchemaDefaultValueMutation extends LocalCatalogSchemaMutation {
    readonly kind = 'modifyAttributeSchemaDefaultValueMutation'
    readonly name: string
    readonly defaultValue?: any

    constructor(name: string, defaultValue?: any) {
        super()
        this.name = name
        this.defaultValue = defaultValue
    }
}
