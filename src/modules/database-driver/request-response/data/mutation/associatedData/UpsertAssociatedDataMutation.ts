import type { EvitaValue } from '@/modules/database-driver/data-type/EvitaValue'
import {
    AssociatedDataMutation
} from '@/modules/database-driver/request-response/data/mutation/associatedData/AssociatedDataMutation.ts'
import type {
    AssociatedDataKey
} from '@/modules/database-driver/request-response/data/mutation/associatedData/AssociatedDataKey.ts'

export class UpsertAssociatedDataMutation extends AssociatedDataMutation {
    static readonly TYPE = 'upsertAssociatedDataMutation' as const

    readonly value: EvitaValue;

    constructor(associatedDataKey: AssociatedDataKey, value: EvitaValue) {
        super(associatedDataKey)
        this.value = value
    }
}
