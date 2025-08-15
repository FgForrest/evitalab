import { EngineMutation } from '@/modules/database-driver/request-response/cdc/EngineMutation.ts'
import type {
    LocalCatalogSchemaMutation
} from '@/modules/database-driver/request-response/cdc/LocalCatalogSchemaMutation.ts'
import { List as ImmutableList } from 'immutable'

export class ModifyCatalogSchemaMutation extends EngineMutation {
    readonly kind = 'modifyCatalogSchemaMutation'
    readonly catalogName: string
    readonly schemaMutations: ImmutableList<LocalCatalogSchemaMutation>

    constructor(catalogName: string, schemaMutations: ImmutableList<LocalCatalogSchemaMutation>) {
        super()
        this.catalogName = catalogName
        this.schemaMutations = schemaMutations
    }
}
