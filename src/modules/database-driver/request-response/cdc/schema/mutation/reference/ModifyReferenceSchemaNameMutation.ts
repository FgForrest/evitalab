import {
    AbstractModifyReferenceDataSchemaMutation
} from '@/modules/database-driver/request-response/cdc/schema/mutation/reference/AbstractModifyReferenceDataSchemaMutation.ts'

export class ModifyReferenceSchemaNameMutation extends AbstractModifyReferenceDataSchemaMutation{
    readonly newName: string

    constructor(name: string, newName: string) {
        super(name)
        this.newName = newName
    }
}
