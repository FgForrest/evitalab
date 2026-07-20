import {
    AttributeSchemaEvolvingMutation
} from '@/modules/database-driver/request-response/data/mutation/attribute/AttributeSchemaEvolvingMutation.ts'
import type { AttributeKey } from '@/modules/database-driver/request-response/data/mutation/attribute/AttributeKey.ts'
import type { Range } from '@/modules/database-driver/data-type/Range.ts'
import type { BigDecimal } from '@/modules/database-driver/data-type/BigDecimal.ts'

/**
 * Range of any supported numeric domain that a delta mutation may constrain its result to.
 */
export type ApplyDeltaRange = Range<number> | Range<bigint> | Range<BigDecimal>

export class ApplyDeltaAttributeMutation extends AttributeSchemaEvolvingMutation {
    static readonly TYPE = 'applyDeltaAttributeMutation' as const

    readonly delta: number
    readonly requiredRangeAfterApplication: ApplyDeltaRange | undefined

    constructor(attributeKey: AttributeKey, delta: number, requiredRangeAfterApplication: ApplyDeltaRange | undefined) {
        super(attributeKey)
        this.delta = delta
        this.requiredRangeAfterApplication = requiredRangeAfterApplication
    }
}
