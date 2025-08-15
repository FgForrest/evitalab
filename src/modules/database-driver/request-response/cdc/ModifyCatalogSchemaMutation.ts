import { EngineMutation } from '@/modules/database-driver/request-response/cdc/EngineMutation.ts'
import type {
    LocalCatalogSchemaMutation
} from '@/modules/database-driver/request-response/cdc/LocalCatalogSchemaMutation.ts'

export class ModifyCatalogSchemaMutation extends EngineMutation {
    readonly kind = 'modifyCatalogSchemaMutation'
    readonly catalogName: string
    readonly schemaMutations: LocalCatalogSchemaMutation[]

    constructor(catalogName: string, schemaMutations: LocalCatalogSchemaMutation[]) {
        super()
        this.catalogName = catalogName
        this.schemaMutations = schemaMutations
    }
}
