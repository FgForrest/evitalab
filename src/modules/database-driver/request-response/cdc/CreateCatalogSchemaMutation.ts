import { EngineMutation } from '@/modules/database-driver/request-response/cdc/EngineMutation.ts'

export class CreateCatalogSchemaMutation extends EngineMutation {
    readonly kind = 'createCatalogSchemaMutation'
    readonly catalogName: string

    constructor(catalogName: string) {
        super()
        this.catalogName = catalogName
    }
}
