import type { AttributeKey } from '@/modules/database-driver/request-response/data/mutation/attribute/AttributeKey.ts'
import type { LocalMutation } from '@/modules/database-driver/request-response/data/mutation/LocalMutation.ts'

export abstract class AttributeMutation implements LocalMutation {
    readonly attributeKey: AttributeKey

    protected constructor(attributeKey: AttributeKey) {
        this.attributeKey = attributeKey
    }
}
