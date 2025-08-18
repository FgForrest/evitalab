import {
    LocalCatalogSchemaMutation
} from '@/modules/database-driver/request-response/cdc/LocalCatalogSchemaMutation.ts'

export class ModifyAttributeSchemaNameMutation extends LocalCatalogSchemaMutation {
    readonly kind = 'modifyAttributeSchemaNameMutation'
    readonly name: string
    readonly newName: string

    constructor(name: string, newName: string) {
        super()
        this.name = name
        this.newName = newName
    }
}
