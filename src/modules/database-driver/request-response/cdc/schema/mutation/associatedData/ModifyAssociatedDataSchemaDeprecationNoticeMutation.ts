import {
    AbstractModifyAssociatedDataSchemaMutation
} from '@/modules/database-driver/request-response/cdc/schema/mutation/associatedData/AbstractModifyAssociatedDataSchemaMutation.ts'
import type { SchemaMutation } from '@/modules/database-driver/request-response/cdc/schema/mutation/SchemaMutation.ts'

export class ModifyAssociatedDataSchemaDeprecationNoticeMutation extends AbstractModifyAssociatedDataSchemaMutation implements SchemaMutation {
    readonly deprecationNotice: string

    constructor(name: string, deprecationNotice: string) {
        super(name)
        this.deprecationNotice = deprecationNotice
    }
}
