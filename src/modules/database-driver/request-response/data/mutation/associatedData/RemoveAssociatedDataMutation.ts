import {
    AssociatedDataMutation
} from '@/modules/database-driver/request-response/data/mutation/associatedData/AssociatedDataMutation.ts'
import type {
    AssociatedDataKey
} from '@/modules/database-driver/request-response/data/mutation/associatedData/AssociatedDataKey.ts'

export class RemoveAssociatedDataMutation extends AssociatedDataMutation{
    static readonly TYPE = 'removeAssociatedDataMutation' as const

    constructor(associatedDataKey: AssociatedDataKey) {
        super(associatedDataKey)
    }
}
