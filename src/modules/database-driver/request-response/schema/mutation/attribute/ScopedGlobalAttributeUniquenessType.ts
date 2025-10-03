import type { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope.ts'
import type {
    GlobalAttributeUniquenessType
} from '@/modules/database-driver/request-response/schema/GlobalAttributeUniquenessType.ts'

export class ScopedGlobalAttributeUniquenessType {
    readonly scope: EntityScope
    readonly uniquenessType: GlobalAttributeUniquenessType

    constructor(scope: EntityScope, uniquenessType: GlobalAttributeUniquenessType) {
        this.scope = scope
        this.uniquenessType = uniquenessType
    }
}
