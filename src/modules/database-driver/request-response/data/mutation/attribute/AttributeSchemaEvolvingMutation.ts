import {
    AttributeMutation
} from '@/modules/database-driver/request-response/data/mutation/attribute/AttributeMutation.ts'
import type { AttributeKey } from '@/modules/database-driver/request-response/data/mutation/AttributeKey.ts'

export class AttributeSchemaEvolvingMutation extends AttributeMutation {
    protected constructor(attributeKey: AttributeKey) {
        super(attributeKey)
    }
}
