import {
    AssociatedDataMutation
} from '@/modules/database-driver/request-response/data/mutation/associated-data/AssociatedDataMutation.ts'
import type {
    AssociatedDataKey
} from '@/modules/database-driver/request-response/data/mutation/associated-data/AssociatedDataKey.ts'

export class RemoveAssociatedDataMutation extends AssociatedDataMutation{
    static readonly TYPE = 'removeAssociatedDataMutation' as const

    constructor(associatedDataKey: AssociatedDataKey) {
        super(associatedDataKey)
    }
}
