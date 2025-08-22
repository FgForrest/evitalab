import type { Cardinality } from '@/modules/database-driver/request-response/schema/Cardinality.ts'
import {
    AbstractModifyReferenceDataSchemaMutation
} from '@/modules/database-driver/request-response/cdc/schema/mutation/reference/AbstractModifyReferenceDataSchemaMutation.ts'

export class ModifyReferenceSchemaCardinalityMutation extends AbstractModifyReferenceDataSchemaMutation {
    readonly cardinality: Cardinality

    constructor(name: string, cardinality: Cardinality) {
        super(name)
        this.cardinality = cardinality
    }
}
