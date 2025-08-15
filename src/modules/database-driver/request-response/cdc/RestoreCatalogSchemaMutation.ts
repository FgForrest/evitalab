import { EngineMutation } from '@/modules/database-driver/request-response/cdc/EngineMutation.ts'

export class RestoreCatalogSchemaMutation extends EngineMutation {
    readonly kind = 'restoreCatalogSchemaMutation'
    readonly catalogName: string

    constructor(catalogName: string) {
        super()
        this.catalogName = catalogName
    }
}
