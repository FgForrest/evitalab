import {
    AssociatedDataMutation
} from '@/modules/database-driver/request-response/data/mutation/associatedData/AssociatedDataMutation.ts'
import type {
    AssociatedDataKey
} from '@/modules/database-driver/request-response/data/mutation/associatedData/AssociatedDataKey.ts'

export class UpsertAssociatedDataMutation extends AssociatedDataMutation {
    static readonly TYPE = 'upsertAssociatedDataMutation' as const

    readonly value: any;

    constructor(associatedDataKey: AssociatedDataKey, value: any) {
        super(associatedDataKey)
        this.value = value
    }
}
