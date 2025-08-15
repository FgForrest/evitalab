import {
    LocalCatalogSchemaMutation
} from '@/modules/database-driver/request-response/cdc/LocalCatalogSchemaMutation.ts'

export class SetAttributeSchemaFilterableMutation extends LocalCatalogSchemaMutation {
    readonly kind = 'setAttributeSchemaFilterableMutation'
    readonly name: string
    readonly filterable: boolean

    constructor(name: string, filterable: boolean) {
        super()
        this.name = name
        this.filterable = filterable
    }
}
