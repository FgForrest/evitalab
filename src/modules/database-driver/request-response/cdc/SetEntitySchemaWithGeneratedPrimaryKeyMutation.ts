import { EntitySchemaMutation } from '@/modules/database-driver/request-response/cdc/EntitySchemaMutation.ts'

export class SetEntitySchemaWithGeneratedPrimaryKeyMutation extends EntitySchemaMutation {
    readonly kind = 'setEntitySchemaWithGeneratedPrimaryKeyMutation'
    readonly withGeneratedPrimaryKey: boolean

    constructor(withGeneratedPrimaryKey: boolean) {
        super()
        this.withGeneratedPrimaryKey = withGeneratedPrimaryKey
    }
}
