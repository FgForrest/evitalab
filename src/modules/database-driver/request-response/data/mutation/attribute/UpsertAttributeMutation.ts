import {
    AttributeSchemaEvolvingMutation
} from '@/modules/database-driver/request-response/data/mutation/attribute/AttributeSchemaEvolvingMutation.ts'
import type { AttributeKey } from '@/modules/database-driver/request-response/data/mutation/attribute/AttributeKey.ts'

export class UpsertAttributeMutation extends AttributeSchemaEvolvingMutation {
    constructor(attributeKey: AttributeKey) {
        super(attributeKey)
    }
}
