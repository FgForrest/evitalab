import { type EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope.ts'
import { type ReferenceIndexType } from '@/modules/database-driver/request-response/schema/ReferenceIndexType.ts'

export class ScopedReferenceIndexType {
    readonly scope: EntityScope
    readonly indexType: ReferenceIndexType

    constructor(scope: EntityScope, indexType: ReferenceIndexType) {
        this.scope = scope
        this.indexType = indexType
    }
}
