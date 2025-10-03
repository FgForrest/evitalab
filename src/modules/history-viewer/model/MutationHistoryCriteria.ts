import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime.ts'
import { Uuid } from '@/modules/database-driver/data-type/Uuid.ts'

/**
 * Mutable user criteria for mutation history filtering
 */
export class MutationHistoryCriteria {

    from?: OffsetDateTime
    to?: OffsetDateTime
    entityPrimaryKey?: number|undefined


    constructor(from?: OffsetDateTime, to?: OffsetDateTime, entityPrimaryKey?: number|undefined) {
        this.from = from
        this.to = to
        this.entityPrimaryKey = entityPrimaryKey
    }
}
