import type { AttributeKey } from '@/modules/database-driver/request-response/cdc/data/mutation/AttributeKey.ts'
import type {
    ReferenceKey
} from '@/modules/database-driver/request-response/cdc/data/mutation/reference/ReferenceKey.ts'

export class ReferenceKeyWithAttributeKey {
    readonly referenceKey: ReferenceKey
    readonly attributeKey: AttributeKey
    constructor(referenceKey: ReferenceKey, attributeKey: AttributeKey) {
        this.referenceKey = referenceKey
        this.attributeKey = attributeKey
    }
}
