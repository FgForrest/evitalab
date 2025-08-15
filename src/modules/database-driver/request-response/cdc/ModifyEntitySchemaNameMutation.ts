import {
    LocalCatalogSchemaMutation
} from '@/modules/database-driver/request-response/cdc/LocalCatalogSchemaMutation.ts'

export class ModifyEntitySchemaNameMutation extends LocalCatalogSchemaMutation {
    readonly kind = 'modifyEntitySchemaNameMutation'
    readonly entityType: string
    readonly newName: string
    readonly overwriteTarget: boolean

    constructor(entityType: string, newName: string, overwriteTarget: boolean) {
        super()
        this.entityType = entityType
        this.newName = newName
        this.overwriteTarget = overwriteTarget
    }
}
