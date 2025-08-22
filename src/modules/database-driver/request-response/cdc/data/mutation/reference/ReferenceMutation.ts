import type {
    ReferenceKey
} from '@/modules/database-driver/request-response/cdc/data/mutation/reference/ReferenceKey.ts'

export abstract class ReferenceMutation<T> {
    readonly referenceKey: ReferenceKey

    constructor(referenceKey: ReferenceKey) {
        this.referenceKey = referenceKey
    }
}
