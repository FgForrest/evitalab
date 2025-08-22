import  {
    type ReferenceKey
} from '@/modules/database-driver/request-response/cdc/data/mutation/reference/ReferenceKey.ts'
import  { type Cardinality } from '@/modules/database-driver/request-response/schema/Cardinality.ts'
import {
    ReferenceMutation
} from '@/modules/database-driver/request-response/cdc/data/mutation/reference/ReferenceMutation.ts'
import type {
    ReferenceKeyWithAttributeKey
} from '@/modules/database-driver/request-response/cdc/data/mutation/reference/ReferenceKeyWithAttributeKey.ts'

export class InsertReferenceMutation extends ReferenceMutation<ReferenceKeyWithAttributeKey> {
    readonly referenceKey: ReferenceKey
    readonly referenceCardinality: Cardinality
    readonly referenceEntityType: string


    constructor(referenceKey: ReferenceKey, referenceCardinality: Cardinality, referenceEntityType: string) {
        super(referenceKey)
        this.referenceKey = referenceKey
        this.referenceCardinality = referenceCardinality
        this.referenceEntityType = referenceEntityType
    }
}
