import type {
    ReferenceKey
} from '@/modules/database-driver/request-response/data/mutation/reference/ReferenceKey.ts'
import type { LocalMutation } from '@/modules/database-driver/request-response/data/mutation/LocalMutation.ts'

export abstract class ReferenceMutation implements LocalMutation {
    readonly referenceKey: ReferenceKey

    constructor(referenceKey: ReferenceKey) {
        this.referenceKey = referenceKey
    }
}
