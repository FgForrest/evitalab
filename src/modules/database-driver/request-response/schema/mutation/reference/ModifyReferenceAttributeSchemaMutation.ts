import type {
    ReferenceAttributeSchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/attribute/ReferenceAttributeSchemaMutation.ts'
import {
    AbstractModifyReferenceDataSchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/reference/AbstractModifyReferenceDataSchemaMutation.ts'

export class ModifyReferenceAttributeSchemaMutation extends AbstractModifyReferenceDataSchemaMutation {
    readonly attributeSchemaMutation: ReferenceAttributeSchemaMutation

    constructor(name: string, attributeSchemaMutation: ReferenceAttributeSchemaMutation) {
        super(name)
        this.attributeSchemaMutation = attributeSchemaMutation
    }
}
