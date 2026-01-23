import {
    AttributeSchemaEvolvingMutation
} from '@/modules/database-driver/request-response/data/mutation/attribute/AttributeSchemaEvolvingMutation.ts'
import type { AttributeKey } from '@/modules/database-driver/request-response/data/mutation/attribute/AttributeKey.ts'

export class UpsertAttributeMutation extends AttributeSchemaEvolvingMutation {
    static readonly TYPE = 'upsertAttributeMutation' as const

    public readonly value: unknown;

    constructor(attributeKey: AttributeKey, value: unknown) {
        super(attributeKey)
        this.value = value
    }
}
