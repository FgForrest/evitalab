import type { Uuid } from '@/modules/database-driver/data-type/Uuid.ts'
import { List as ImmutableList } from 'immutable'
import type {
    LocalCatalogSchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/LocalCatalogSchemaMutation.ts'

export class ModifyCatalogSchemaMutation {
    readonly catalogName: string
    readonly sessionId: Uuid|undefined
    readonly schemaMutations: ImmutableList<LocalCatalogSchemaMutation>

    constructor(catalogName: string, sessionId: Uuid|undefined, schemaMutations: ImmutableList<LocalCatalogSchemaMutation>) {
        this.catalogName = catalogName
        this.sessionId = sessionId
        this.schemaMutations = schemaMutations
    }
}
