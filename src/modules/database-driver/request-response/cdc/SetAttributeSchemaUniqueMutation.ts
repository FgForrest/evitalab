import {
    LocalCatalogSchemaMutation
} from '@/modules/database-driver/request-response/cdc/LocalCatalogSchemaMutation.ts'

export class SetAttributeSchemaUniqueMutation extends LocalCatalogSchemaMutation {
    readonly kind = 'setAttributeSchemaUniqueMutation'
    readonly name: string
    readonly unique: boolean

    constructor(name: string, unique: boolean) {
        super()
        this.name = name
        this.unique = unique
    }
}
