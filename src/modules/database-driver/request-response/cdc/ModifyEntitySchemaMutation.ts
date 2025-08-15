import {
    LocalCatalogSchemaMutation
} from '@/modules/database-driver/request-response/cdc/LocalCatalogSchemaMutation.ts'
import type { EntitySchemaMutation } from '@/modules/database-driver/request-response/cdc/EntitySchemaMutation.ts'

export class ModifyEntitySchemaMutation extends LocalCatalogSchemaMutation {
    readonly kind = 'modifyEntitySchemaMutation'
    readonly entityType: string
    readonly entitySchemaMutations: EntitySchemaMutation[]

    constructor(entityType: string, entitySchemaMutations: EntitySchemaMutation[]) {
        super()
        this.entityType = entityType
        this.entitySchemaMutations = entitySchemaMutations
    }
}
