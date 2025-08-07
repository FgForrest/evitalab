import type { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope.ts'
import type {
    GlobalAttributeUniquenessType
} from '@/modules/database-driver/request-response/schema/GlobalAttributeUniquenessType.ts'

/**
 * Combines global attribute uniqueness type with the scope in which it is enforced.
 *
 * Specifies whether a global attribute must be unique across the entire catalog,
 * optionally considering localization.
 */
export class ScopedGlobalAttributeUniquenessType {
    readonly scope: EntityScope
    readonly uniquenessType: GlobalAttributeUniquenessType
    constructor(entityScope: EntityScope, uniquenessType: GlobalAttributeUniquenessType) {
        this.scope = entityScope
        this.uniquenessType = uniquenessType
    }
}
