import { EntitySchemaMutation } from '@/modules/database-driver/request-response/cdc/EntitySchemaMutation.ts'

export class SetEntitySchemaWithHierarchyMutation extends EntitySchemaMutation {
    readonly kind = 'setEntitySchemaWithHierarchyMutation'
    readonly withHierarchy: boolean

    constructor(withHierarchy: boolean) {
        super()
        this.withHierarchy = withHierarchy
    }
}
