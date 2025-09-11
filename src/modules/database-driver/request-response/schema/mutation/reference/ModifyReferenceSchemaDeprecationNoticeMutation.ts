import {
    AbstractModifyReferenceDataSchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/reference/AbstractModifyReferenceDataSchemaMutation.ts'

export class ModifyReferenceSchemaDeprecationNoticeMutation extends AbstractModifyReferenceDataSchemaMutation {
    readonly deprecationNotice: string
    constructor(name: string, deprecationNotice: string) {
        super(name)
        this.deprecationNotice = deprecationNotice
    }
}
