import type {
    ReferenceKey
} from '@/modules/database-driver/request-response/data/mutation/reference/ReferenceKey.ts'
import type { AttributeKey } from '@/modules/database-driver/request-response/data/mutation/attribute/AttributeKey.ts'

export class ReferenceKeyWithAttributeKey {
    readonly referenceKey: ReferenceKey
    readonly attributeKey: AttributeKey
    constructor(referenceKey: ReferenceKey, attributeKey: AttributeKey) {
        this.referenceKey = referenceKey
        this.attributeKey = attributeKey
    }
}
