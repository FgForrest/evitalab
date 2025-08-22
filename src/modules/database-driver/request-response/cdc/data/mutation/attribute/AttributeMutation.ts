import type { AttributeKey } from '@/modules/database-driver/request-response/cdc/data/mutation/AttributeKey.ts'

export abstract class AttributeMutation {
    readonly attributeKey: AttributeKey

    protected constructor(attributeKey: AttributeKey) {
        this.attributeKey = attributeKey
    }
}
