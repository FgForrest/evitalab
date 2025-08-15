import {
    LocalCatalogSchemaMutation
} from '@/modules/database-driver/request-response/cdc/LocalCatalogSchemaMutation.ts'

export class ModifyAttributeSchemaNameMutation extends LocalCatalogSchemaMutation {
    readonly kind = 'modifyAttributeSchemaNameMutation'
    readonly name: string
    readonly newName: string
    readonly overwriteTarget: boolean

    constructor(name: string, newName: string, overwriteTarget: boolean) {
        super()
        this.name = name
        this.newName = newName
        this.overwriteTarget = overwriteTarget
    }
}
