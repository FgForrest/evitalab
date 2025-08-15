import {
    LocalCatalogSchemaMutation
} from '@/modules/database-driver/request-response/cdc/LocalCatalogSchemaMutation.ts'

export class ModifyCatalogSchemaDescriptionMutation extends LocalCatalogSchemaMutation {
    readonly kind = 'modifyCatalogSchemaDescriptionMutation'
    readonly description?: string

    constructor(description?: string) {
        super()
        this.description = description
    }
}
