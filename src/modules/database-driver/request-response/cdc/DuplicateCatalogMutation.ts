import { EngineMutation } from '@/modules/database-driver/request-response/cdc/EngineMutation.ts'

export class DuplicateCatalogMutation extends EngineMutation {
    readonly kind = 'duplicateCatalogMutation'
    readonly catalogName: string
    readonly newCatalogName: string

    constructor(catalogName: string, newCatalogName: string) {
        super()
        this.catalogName = catalogName
        this.newCatalogName = newCatalogName
    }
}
