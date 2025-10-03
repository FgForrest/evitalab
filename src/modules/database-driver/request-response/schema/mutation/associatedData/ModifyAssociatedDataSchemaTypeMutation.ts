import type { SchemaMutation } from '@/modules/database-driver/request-response/schema/mutation/SchemaMutation.ts'
import {
    AbstractModifyAssociatedDataSchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/associatedData/AbstractModifyAssociatedDataSchemaMutation.ts'
import type { Scalar } from '@/modules/database-driver/data-type/Scalar.ts'

export class ModifyAssociatedDataSchemaTypeMutation extends AbstractModifyAssociatedDataSchemaMutation  implements SchemaMutation {
    readonly type: Scalar

    constructor(name: string, type: Scalar) {
        super(name)
        this.type = type
    }
}
