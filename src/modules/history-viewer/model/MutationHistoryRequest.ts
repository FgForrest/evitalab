import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime.ts'

export class MutationHistoryRequest {
    readonly from?: OffsetDateTime
    readonly to?: OffsetDateTime
    readonly entityPrimaryKey?: number|undefined
    readonly entityType?: string|undefined


    constructor(from: OffsetDateTime | undefined, to: OffsetDateTime | undefined, entityPrimaryKey: number | undefined, entityType: string | undefined) {
        this.from = from
        this.to = to
        this.entityPrimaryKey = entityPrimaryKey
        this.entityType = entityType
    }
}
