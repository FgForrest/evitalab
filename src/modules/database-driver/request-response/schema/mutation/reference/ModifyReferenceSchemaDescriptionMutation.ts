import {
    AbstractModifyReferenceDataSchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/reference/AbstractModifyReferenceDataSchemaMutation.ts'

export class ModifyReferenceSchemaDescriptionMutation extends AbstractModifyReferenceDataSchemaMutation {
    readonly description: string|undefined

    constructor(name: string, description: string|undefined) {
        super(name)
        this.description = description
    }
}
