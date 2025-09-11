import type { LocalMutation } from '@/modules/database-driver/request-response/data/mutation/LocalMutation.ts'
import type {
    AssociatedDataKey
} from '@/modules/database-driver/request-response/data/mutation/associatedData/AssociatedDataKey.ts'

export abstract class AssociatedDataMutation implements LocalMutation {
    readonly associatedDataKey: AssociatedDataKey

    constructor(associatedDataKey: AssociatedDataKey) {
        this.associatedDataKey = associatedDataKey
    }
}
