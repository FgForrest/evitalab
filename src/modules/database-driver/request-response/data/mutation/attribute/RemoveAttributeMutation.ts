import {
    AttributeMutation
} from '@/modules/database-driver/request-response/data/mutation/attribute/AttributeMutation.ts'
import type { AttributeKey } from '@/modules/database-driver/request-response/data/mutation/attribute/AttributeKey.ts'

export class RemoveAttributeMutation extends AttributeMutation {
    static readonly TYPE = 'removeAttributeMutation' as const

    constructor(attributeKey: AttributeKey) {
        super(attributeKey)
    }
}
