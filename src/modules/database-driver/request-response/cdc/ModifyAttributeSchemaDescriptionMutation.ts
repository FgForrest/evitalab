import {
    LocalCatalogSchemaMutation
} from '@/modules/database-driver/request-response/cdc/LocalCatalogSchemaMutation.ts'

export class ModifyAttributeSchemaDescriptionMutation extends LocalCatalogSchemaMutation {
    readonly kind = 'modifyAttributeSchemaDescriptionMutation'
    readonly name: string
    readonly description?: string

    constructor(name: string, description?: string) {
        super()
        this.name = name
        this.description = description
    }
}
