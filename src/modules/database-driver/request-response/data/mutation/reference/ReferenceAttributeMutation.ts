import {
    type AttributeMutation
} from '@/modules/database-driver/request-response/data/mutation/attribute/AttributeMutation.ts'
import {
    ReferenceKeyWithAttributeKey
} from '@/modules/database-driver/request-response/data/mutation/reference/ReferenceKeyWithAttributeKey.ts'
import {
    ReferenceMutation
} from '@/modules/database-driver/request-response/data/mutation/reference/ReferenceMutation.ts'
import type {
    ReferenceKey
} from '@/modules/database-driver/request-response/data/mutation/reference/ReferenceKey.ts'
import type { AttributeKey } from '@/modules/database-driver/request-response/data/mutation/attribute/AttributeKey.ts'

export class ReferenceAttributeMutation extends ReferenceMutation {
    static readonly TYPE = 'referenceAttributeMutation' as const

    readonly attributeMutation: AttributeMutation
    readonly attributeKey: AttributeKey
    readonly comparableKey: ReferenceKeyWithAttributeKey


    constructor(referenceKey: ReferenceKey, attributeMutation: AttributeMutation) {
        super(referenceKey)
        this.attributeMutation = attributeMutation
        this.attributeKey = attributeMutation.attributeKey
        this.comparableKey = new ReferenceKeyWithAttributeKey(referenceKey, this.attributeKey)
    }
}
