import { EngineMutation } from '@/modules/database-driver/request-response/cdc/EngineMutation.ts'

export class SetCatalogStateMutation extends EngineMutation {
    readonly kind = 'setCatalogStateMutation'
    readonly catalogName: string
    readonly active: boolean

    constructor(catalogName: string, active: boolean) {
        super()
        this.catalogName = catalogName
        this.active = active
    }
}
