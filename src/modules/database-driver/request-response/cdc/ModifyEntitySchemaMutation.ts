import {
    LocalCatalogSchemaMutation
} from '@/modules/database-driver/request-response/cdc/LocalCatalogSchemaMutation.ts'
import type { EntitySchemaMutation } from '@/modules/database-driver/request-response/cdc/EntitySchemaMutation.ts'
import { List as ImmutableList } from 'immutable'

export class ModifyEntitySchemaMutation extends LocalCatalogSchemaMutation {
    readonly kind = 'modifyEntitySchemaMutation'
    readonly entityType: string
    readonly entitySchemaMutations: ImmutableList<EntitySchemaMutation>

    constructor(entityType: string, entitySchemaMutations: ImmutableList<EntitySchemaMutation>) {
        super()
        this.entityType = entityType
        this.entitySchemaMutations = entitySchemaMutations
    }
}
