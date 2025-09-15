import {
    ReferenceMutation
} from '@/modules/database-driver/request-response/data/mutation/reference/ReferenceMutation.ts'
import type {
    ReferenceKeyWithAttributeKey
} from '@/modules/database-driver/request-response/data/mutation/reference/ReferenceKeyWithAttributeKey.ts'
import type { ReferenceKey } from '@/modules/database-driver/request-response/data/mutation/reference/ReferenceKey.ts'

export class SetReferenceGroupMutation extends ReferenceMutation<ReferenceKeyWithAttributeKey> {
    readonly resolvedGroupType: string | undefined
    readonly groupPrimaryKey: number
    readonly groupType: string | undefined

    constructor(referenceKey: ReferenceKey, resolvedGroupType: string | undefined, groupType: string | undefined, groupPrimaryKey: number) {
        super(referenceKey)
        this.resolvedGroupType = resolvedGroupType
        this.groupPrimaryKey = groupPrimaryKey
        this.groupType = groupType
    }


}
