import {
    AbstractModifyAssociatedDataSchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/associatedData/AbstractModifyAssociatedDataSchemaMutation.ts'
import type { SchemaMutation } from '@/modules/database-driver/request-response/schema/mutation/SchemaMutation.ts'

export class ModifyAssociatedDataSchemaDescriptionMutation extends AbstractModifyAssociatedDataSchemaMutation implements SchemaMutation {
    readonly description: string|undefined

    constructor(name: string, description: string|undefined) {
        super(name)
        this.description = description
    }
}
