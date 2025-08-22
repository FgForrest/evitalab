import type { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope.ts'
import type {
    AttributeUniquenessType
} from '@/modules/database-driver/request-response/schema/AttributeUniquenessType.ts'

export class ScopedAttributeUniquenessType {
    readonly scope: EntityScope
    readonly uniquenessType: AttributeUniquenessType

    constructor(scope: EntityScope, uniquenessType: AttributeUniquenessType) {
        this.scope = scope
        this.uniquenessType = uniquenessType
    }
}
