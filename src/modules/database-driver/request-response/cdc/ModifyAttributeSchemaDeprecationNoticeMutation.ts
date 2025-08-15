import {
    LocalCatalogSchemaMutation
} from '@/modules/database-driver/request-response/cdc/LocalCatalogSchemaMutation.ts'

export class ModifyAttributeSchemaDeprecationNoticeMutation extends LocalCatalogSchemaMutation {
    readonly kind = 'modifyAttributeSchemaDeprecationNoticeMutation'
    readonly name: string
    readonly deprecationNotice?: string

    constructor(name: string, deprecationNotice?: string) {
        super()
        this.name = name
        this.deprecationNotice = deprecationNotice
    }
}
