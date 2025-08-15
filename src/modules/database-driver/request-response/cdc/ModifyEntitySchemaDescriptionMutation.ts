import { EntitySchemaMutation } from '@/modules/database-driver/request-response/cdc/EntitySchemaMutation.ts'

export class ModifyEntitySchemaDescriptionMutation extends EntitySchemaMutation {
    readonly kind = 'modifyEntitySchemaDescriptionMutation'
    readonly description?: string

    constructor(description?: string) {
        super()
        this.description = description
    }
}
