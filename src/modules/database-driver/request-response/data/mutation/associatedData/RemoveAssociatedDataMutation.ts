import {
    AssociatedDataMutation
} from '@/modules/database-driver/request-response/data/mutation/associatedData/AssociatedDataMutation.ts'
import type {
    AssociatedDataKey
} from '@/modules/database-driver/request-response/data/mutation/associatedData/AssociatedDataKey.ts'

export class RemoveAssociatedDataMutation extends AssociatedDataMutation{

    constructor(associatedDataKey: AssociatedDataKey) {
        super(associatedDataKey)
    }
}
