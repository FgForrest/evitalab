import { EngineMutation } from '@/modules/database-driver/request-response/cdc/EngineMutation.ts'

export class MakeCatalogAliveMutation extends EngineMutation {
    readonly kind = 'makeCatalogAliveMutation'
    readonly catalogName: string

    constructor(catalogName: string) {
        super()
        this.catalogName = catalogName
    }
}
