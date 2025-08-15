import {
    LocalCatalogSchemaMutation
} from '@/modules/database-driver/request-response/cdc/LocalCatalogSchemaMutation.ts'

export class SetAttributeSchemaLocalizedMutation extends LocalCatalogSchemaMutation {
    readonly kind = 'setAttributeSchemaLocalizedMutation'
    readonly name: string
    readonly localized: boolean

    constructor(name: string, localized: boolean) {
        super()
        this.name = name
        this.localized = localized
    }
}
