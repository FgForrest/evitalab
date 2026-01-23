import {
    AssociatedDataMutation
} from '@/modules/database-driver/request-response/data/mutation/associatedData/AssociatedDataMutation.ts'
import type {
    AssociatedDataKey
} from '@/modules/database-driver/request-response/data/mutation/associatedData/AssociatedDataKey.ts'

export class UpsertAssociatedDataMutation extends AssociatedDataMutation {
    static readonly TYPE = 'upsertAssociatedDataMutation' as const

    readonly value: unknown;

    constructor(associatedDataKey: AssociatedDataKey, value: unknown) {
        super(associatedDataKey)
        this.value = value
    }
}
