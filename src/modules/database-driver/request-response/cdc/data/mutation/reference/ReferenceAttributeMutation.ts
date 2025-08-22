import  {
    type AttributeMutation
} from '@/modules/database-driver/request-response/cdc/data/mutation/attribute/AttributeMutation.ts'
import  { type AttributeKey } from '@/modules/database-driver/request-response/cdc/data/mutation/AttributeKey.ts'
import  {
    type ReferenceKeyWithAttributeKey
} from '@/modules/database-driver/request-response/cdc/data/mutation/reference/ReferenceKeyWithAttributeKey.ts'
import {
    ReferenceMutation
} from '@/modules/database-driver/request-response/cdc/data/mutation/reference/ReferenceMutation.ts'
import type {
    ReferenceKey
} from '@/modules/database-driver/request-response/cdc/data/mutation/reference/ReferenceKey.ts'

export class ReferenceAttributeMutation extends ReferenceMutation<ReferenceKeyWithAttributeKey> {
    readonly attributeMutation: AttributeMutation
    readonly attributeKey: AttributeKey
    readonly comparableKey: ReferenceKeyWithAttributeKey


    constructor(referenceKey: ReferenceKey, attributeMutation: AttributeMutation, attributeKey: AttributeKey, comparableKey: ReferenceKeyWithAttributeKey) {
        super(referenceKey)
        this.attributeMutation = attributeMutation
        this.attributeKey = attributeKey
        this.comparableKey = comparableKey
    }
}
