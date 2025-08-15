import { EntitySchemaMutation } from '@/modules/database-driver/request-response/cdc/EntitySchemaMutation.ts'

export class ModifyEntitySchemaDeprecationNoticeMutation extends EntitySchemaMutation {
    readonly kind = 'modifyEntitySchemaDeprecationNoticeMutation'
    readonly deprecationNotice?: string

    constructor(deprecationNotice?: string) {
        super()
        this.deprecationNotice = deprecationNotice
    }
}
