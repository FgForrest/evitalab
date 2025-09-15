import {
    AbstractModifyReferenceDataSchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/reference/AbstractModifyReferenceDataSchemaMutation.ts'

export class ModifyReferenceSchemaDeprecationNoticeMutation extends AbstractModifyReferenceDataSchemaMutation {
    readonly deprecationNotice: string|undefined

    constructor(name: string, deprecationNotice: string|undefined) {
        super(name)
        this.deprecationNotice = deprecationNotice
    }
}
