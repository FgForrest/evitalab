import {
    AbstractModifyReferenceDataSchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/reference/AbstractModifyReferenceDataSchemaMutation.ts'

export class ModifyReferenceSchemaDescriptionMutation extends AbstractModifyReferenceDataSchemaMutation {
    readonly description: string

    constructor(name: string, description: string) {
        super(name)
        this.description = description
    }
}
