import type { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope.ts'
import type {
    GlobalAttributeUniquenessType
} from '@/modules/database-driver/request-response/schema/GlobalAttributeUniquenessType.ts'

export class ScopedGlobalAttributeUniquenessType {
    readonly scope: EntityScope
    readonly uniquenessType: GlobalAttributeUniquenessType
    constructor(entityScope: EntityScope, uniquenessType: GlobalAttributeUniquenessType) {
        this.scope = entityScope
        this.uniquenessType = uniquenessType
    }
}
