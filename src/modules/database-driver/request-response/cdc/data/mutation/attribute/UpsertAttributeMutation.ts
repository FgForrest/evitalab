import {
    AttributeSchemaEvolvingMutation
} from '@/modules/database-driver/request-response/cdc/data/mutation/attribute/AttributeSchemaEvolvingMutation.ts'
import type { AttributeKey } from '@/modules/database-driver/request-response/cdc/data/mutation/AttributeKey.ts'

export class UpsertAttributeMutation extends AttributeSchemaEvolvingMutation {
    constructor(attributeKey: AttributeKey) {
        super(attributeKey)
    }
}
