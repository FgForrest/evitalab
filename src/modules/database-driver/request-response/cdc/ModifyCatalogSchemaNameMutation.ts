import { EngineMutation } from '@/modules/database-driver/request-response/cdc/EngineMutation.ts'

export class ModifyCatalogSchemaNameMutation extends EngineMutation {
    readonly kind = 'modifyCatalogSchemaNameMutation'
    readonly catalogName: string
    readonly newCatalogName: string
    readonly overwriteTarget: boolean

    constructor(catalogName: string, newCatalogName: string, overwriteTarget: boolean) {
        super()
        this.catalogName = catalogName
        this.newCatalogName = newCatalogName
        this.overwriteTarget = overwriteTarget
    }
}
