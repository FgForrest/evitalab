import  { type EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope.ts'
import type {
    AttributeUniquenessType
} from '@/modules/database-driver/request-response/schema/AttributeUniquenessType.ts'

/**
 * Combines attribute uniqueness type with the entity scope in which it's enforced.
 *
 * Specifies whether the attribute must be unique and in what context
 * (e.g. within a collection or collection + locale).
 */
export class ScopedAttributeUniquenessType {
    readonly scope: EntityScope
    readonly uniquenessType: AttributeUniquenessType

    constructor(entityScope: EntityScope, uniquenessType: AttributeUniquenessType) {
        this.scope = entityScope
        this.uniquenessType = uniquenessType
    }
}
