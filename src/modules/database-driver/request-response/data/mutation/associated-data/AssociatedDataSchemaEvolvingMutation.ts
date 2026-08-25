import {
    AssociatedDataMutation
} from '@/modules/database-driver/request-response/data/mutation/associated-data/AssociatedDataMutation.ts'
import type {
    AssociatedDataKey
} from '@/modules/database-driver/request-response/data/mutation/associated-data/AssociatedDataKey.ts'

export class AssociatedDataSchemaEvolvingMutation extends AssociatedDataMutation {

    constructor(associatedDataKey: AssociatedDataKey) {
        super(associatedDataKey)
    }
}
