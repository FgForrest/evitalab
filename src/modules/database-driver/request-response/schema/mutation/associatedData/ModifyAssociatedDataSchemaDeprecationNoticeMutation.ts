import {
    AbstractModifyAssociatedDataSchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/associatedData/AbstractModifyAssociatedDataSchemaMutation.ts'
import type { SchemaMutation } from '@/modules/database-driver/request-response/schema/mutation/SchemaMutation.ts'

export class ModifyAssociatedDataSchemaDeprecationNoticeMutation extends AbstractModifyAssociatedDataSchemaMutation implements SchemaMutation {
    readonly deprecationNotice: string|undefined

    constructor(name: string, deprecationNotice: string|undefined=undefined) {
        super(name)
        this.deprecationNotice = deprecationNotice
    }
}
