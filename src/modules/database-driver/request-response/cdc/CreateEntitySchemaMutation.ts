import {
    LocalCatalogSchemaMutation
} from '@/modules/database-driver/request-response/cdc/LocalCatalogSchemaMutation.ts'

export class CreateEntitySchemaMutation extends LocalCatalogSchemaMutation {
    readonly kind = 'createEntitySchemaMutation'
    readonly entityType: string

    constructor(entityType: string) {
        super()
        this.entityType = entityType
    }
}
