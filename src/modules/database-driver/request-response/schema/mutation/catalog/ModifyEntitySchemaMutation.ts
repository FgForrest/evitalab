import { List as ImmutableList } from 'immutable'
import type {
    LocalCatalogSchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/LocalCatalogSchemaMutation.ts'

export class ModifyEntitySchemaMutation {
    readonly entityType: string
    readonly schemaMutations: ImmutableList<LocalCatalogSchemaMutation>

    constructor(entityType: string, schemaMutations: ImmutableList<LocalCatalogSchemaMutation>) {
        this.entityType = entityType
        this.schemaMutations = schemaMutations
    }
}
