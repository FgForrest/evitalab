import  { type AssociatedDataKey } from '@/modules/database-driver/request-response/cdc/data/AssociatedDataKey.ts'

export class AssociatedDataMutation {
    readonly associatedDataKey: AssociatedDataKey

    constructor(associatedDataKey: AssociatedDataKey) {
        this.associatedDataKey = associatedDataKey
    }
}
