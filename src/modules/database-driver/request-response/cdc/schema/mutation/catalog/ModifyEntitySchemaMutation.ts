import Immutable, { List as ImmutableList } from 'immutable'
import type {
    LocalCatalogSchemaMutation
} from '@/modules/database-driver/request-response/cdc/schema/mutation/LocalCatalogSchemaMutation.ts'

export class ModifyEntitySchemaMutation {
    readonly entityType: string
    readonly schemaMutations: ImmutableList<LocalCatalogSchemaMutation>

    constructor(entityType: string, schemaMutations: Immutable.List<LocalCatalogSchemaMutation>) {
        this.entityType = entityType
        this.schemaMutations = schemaMutations
    }
}
