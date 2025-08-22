import {
    AttributeMutation
} from '@/modules/database-driver/request-response/cdc/data/mutation/attribute/AttributeMutation.ts'
import type { AttributeKey } from '@/modules/database-driver/request-response/cdc/data/mutation/AttributeKey.ts'

export class RemoveAttributeMutation extends AttributeMutation {
    constructor(attributeKey: AttributeKey) {
        super(attributeKey)
    }
}
