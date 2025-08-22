import {
    ReferenceMutation
} from '@/modules/database-driver/request-response/cdc/data/mutation/reference/ReferenceMutation.ts'
import  {
    type ReferenceKey
} from '@/modules/database-driver/request-response/cdc/data/mutation/reference/ReferenceKey.ts'

export class RemoveReferenceMutation extends ReferenceMutation<ReferenceKey> {
    constructor(referenceKey: ReferenceKey) {
        super(referenceKey)
    }
}
