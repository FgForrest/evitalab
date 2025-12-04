import {
    AssociatedDataMutation
} from '@/modules/database-driver/request-response/data/mutation/associatedData/AssociatedDataMutation.ts'
import type {
    AssociatedDataKey
} from '@/modules/database-driver/request-response/data/mutation/associatedData/AssociatedDataKey.ts'
import type { Locale } from '@/modules/database-driver/data-type/Locale.ts'

export class UpsertAssociatedDataMutation extends AssociatedDataMutation {

    readonly value: any;

    constructor(associatedDataKey: AssociatedDataKey, value: any) {
        super(associatedDataKey)
        this.value = value
    }
}
