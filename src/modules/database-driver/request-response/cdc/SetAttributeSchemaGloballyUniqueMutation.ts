import {
    LocalCatalogSchemaMutation
} from '@/modules/database-driver/request-response/cdc/LocalCatalogSchemaMutation.ts'

export class SetAttributeSchemaGloballyUniqueMutation extends LocalCatalogSchemaMutation {
    readonly kind = 'setAttributeSchemaGloballyUniqueMutation'
    readonly name: string
    readonly uniqueGlobally: boolean

    constructor(name: string, uniqueGlobally: boolean) {
        super()
        this.name = name
        this.uniqueGlobally = uniqueGlobally
    }
}
