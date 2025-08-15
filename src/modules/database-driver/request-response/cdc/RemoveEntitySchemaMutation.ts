import {
    LocalCatalogSchemaMutation
} from '@/modules/database-driver/request-response/cdc/LocalCatalogSchemaMutation.ts'

export class RemoveEntitySchemaMutation extends LocalCatalogSchemaMutation {
    readonly kind = 'removeEntitySchemaMutation'
    readonly entityType: string

    constructor(entityType: string) {
        super()
        this.entityType = entityType
    }
}
