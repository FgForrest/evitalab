import { EngineMutation } from '@/modules/database-driver/request-response/cdc/EngineMutation.ts'

export class SetCatalogMutabilityMutation extends EngineMutation {
    readonly kind = 'setCatalogMutabilityMutation'
    readonly catalogName: string
    readonly mutable: boolean

    constructor(catalogName: string, mutable: boolean) {
        super()
        this.catalogName = catalogName
        this.mutable = mutable
    }
}
