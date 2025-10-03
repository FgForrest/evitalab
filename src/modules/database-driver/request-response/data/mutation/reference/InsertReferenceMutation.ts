import  {
    type ReferenceKey
} from '@/modules/database-driver/request-response/data/mutation/reference/ReferenceKey.ts'
import  { type Cardinality } from '@/modules/database-driver/request-response/schema/Cardinality.ts'
import {
    ReferenceMutation
} from '@/modules/database-driver/request-response/data/mutation/reference/ReferenceMutation.ts'
import type {
    ReferenceKeyWithAttributeKey
} from '@/modules/database-driver/request-response/data/mutation/reference/ReferenceKeyWithAttributeKey.ts'

export class InsertReferenceMutation extends ReferenceMutation {
    readonly referenceKey: ReferenceKey
    readonly referenceCardinality: Cardinality
    readonly referenceEntityType: string|undefined


    constructor(referenceKey: ReferenceKey, referenceCardinality: Cardinality, referenceEntityType: string|undefined) {
        super(referenceKey)
        this.referenceKey = referenceKey
        this.referenceCardinality = referenceCardinality
        this.referenceEntityType = referenceEntityType
    }
}
