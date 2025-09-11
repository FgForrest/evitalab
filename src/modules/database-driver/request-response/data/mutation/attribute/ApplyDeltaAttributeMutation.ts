import {
    AttributeSchemaEvolvingMutation
} from '@/modules/database-driver/request-response/data/mutation/attribute/AttributeSchemaEvolvingMutation.ts'
import Immutable, { List as ImmutableList } from 'immutable'
import { types } from 'sass'
import Number = types.Number
import type { AttributeKey } from '@/modules/database-driver/request-response/data/mutation/AttributeKey.ts'

export class ApplyDeltaAttributeMutation<T extends Number> extends AttributeSchemaEvolvingMutation {
    readonly delta: T
    readonly requiredRangeAfterApplication: ImmutableList<T>

    constructor(attributeKey: AttributeKey, delta: T, requiredRangeAfterApplication: Immutable.List<T>) {
        super(attributeKey)
        this.delta = delta
        this.requiredRangeAfterApplication = requiredRangeAfterApplication
    }
}
