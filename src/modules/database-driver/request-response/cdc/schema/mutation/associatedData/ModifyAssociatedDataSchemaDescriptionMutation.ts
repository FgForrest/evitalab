import {
    AbstractModifyAssociatedDataSchemaMutation
} from '@/modules/database-driver/request-response/cdc/schema/mutation/associatedData/AbstractModifyAssociatedDataSchemaMutation.ts'
import type { SchemaMutation } from '@/modules/database-driver/request-response/cdc/schema/mutation/SchemaMutation.ts'

export class ModifyAssociatedDataSchemaDescriptionMutation extends AbstractModifyAssociatedDataSchemaMutation implements SchemaMutation {
    readonly description: string

    constructor(name: string, description: string) {
        super(name)
        this.description = description
    }
}
