import {
    AttributeSchemaEvolvingMutation
} from '@/modules/database-driver/request-response/data/mutation/attribute/AttributeSchemaEvolvingMutation.ts'
import { types } from 'sass'
import type { AttributeKey } from '@/modules/database-driver/request-response/data/mutation/attribute/AttributeKey.ts'
import type { Range } from '@/modules/database-driver/data-type/Range.ts'
import Number = types.Number

export class ApplyDeltaAttributeMutation<T extends Number> extends AttributeSchemaEvolvingMutation {
    readonly delta: T
    readonly requiredRangeAfterApplication: Range<T>|undefined

    constructor(attributeKey: AttributeKey, delta: T, requiredRangeAfterApplication: Range<T>|undefined) {
        super(attributeKey)
        this.delta = delta
        this.requiredRangeAfterApplication = requiredRangeAfterApplication
    }
}
