import {
    ReferenceMutation
} from '@/modules/database-driver/request-response/data/mutation/reference/ReferenceMutation.ts'
import type { ReferenceKey } from '@/modules/database-driver/request-response/data/mutation/reference/ReferenceKey.ts'

export class RemoveReferenceGroupMutation extends ReferenceMutation {
    static readonly TYPE = 'removeReferenceGroupMutation' as const

    constructor(referenceKey: ReferenceKey) {
        super(referenceKey)
    }
}
