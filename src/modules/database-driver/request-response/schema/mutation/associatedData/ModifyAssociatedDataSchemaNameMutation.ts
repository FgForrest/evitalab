import {
    AbstractModifyAssociatedDataSchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/associatedData/AbstractModifyAssociatedDataSchemaMutation.ts'
import type { SchemaMutation } from '@/modules/database-driver/request-response/schema/mutation/SchemaMutation.ts'

export class ModifyAssociatedDataSchemaNameMutation extends AbstractModifyAssociatedDataSchemaMutation implements SchemaMutation {
    readonly newName: string

    constructor(name: string, newName: string) {
        super(name)
        this.newName = newName
    }
}
