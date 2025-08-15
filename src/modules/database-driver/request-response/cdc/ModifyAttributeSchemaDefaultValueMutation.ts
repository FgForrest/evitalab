import {
    LocalCatalogSchemaMutation
} from '@/modules/database-driver/request-response/cdc/LocalCatalogSchemaMutation.ts'

export class ModifyAttributeSchemaDefaultValueMutation extends LocalCatalogSchemaMutation {
    readonly kind = 'modifyAttributeSchemaDefaultValueMutation'
    readonly name: string
    readonly defaultValue?: string | number | boolean | null

    constructor(name: string, defaultValue: string | number | boolean | null | undefined) {
        super()
        this.name = name
        this.defaultValue = defaultValue
    }
}
