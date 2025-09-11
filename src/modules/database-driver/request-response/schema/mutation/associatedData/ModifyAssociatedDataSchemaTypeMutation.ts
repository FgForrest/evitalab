import type { SchemaMutation } from '@/modules/database-driver/request-response/schema/mutation/SchemaMutation.ts'
import {
    AbstractModifyAssociatedDataSchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/associatedData/AbstractModifyAssociatedDataSchemaMutation.ts'

export class ModifyAssociatedDataSchemaTypeMutation extends AbstractModifyAssociatedDataSchemaMutation  implements SchemaMutation {
    readonly type: any

    constructor(name: string, type: any) {
        super(name)
        this.type = type
    }
}
