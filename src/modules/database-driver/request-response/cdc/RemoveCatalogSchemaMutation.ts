import { EngineMutation } from '@/modules/database-driver/request-response/cdc/EngineMutation.ts'

export class RemoveCatalogSchemaMutation extends EngineMutation {
    readonly kind = 'removeCatalogSchemaMutation'
    readonly catalogName: string

    constructor(catalogName: string) {
        super()
        this.catalogName = catalogName
    }
}
