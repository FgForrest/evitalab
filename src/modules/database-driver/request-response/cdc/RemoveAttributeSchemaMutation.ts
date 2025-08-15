import {
    LocalCatalogSchemaMutation
} from '@/modules/database-driver/request-response/cdc/LocalCatalogSchemaMutation.ts'

export class RemoveAttributeSchemaMutation extends LocalCatalogSchemaMutation {
    readonly kind = 'removeAttributeSchemaMutation'
    readonly name: string

    constructor(name: string) {
        super()
        this.name = name
    }
}
