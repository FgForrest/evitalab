import { List as ImmutableList } from 'immutable'
import type { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope.ts'

export class SetEntitySchemaWithHierarchyMutation {
    readonly withHierarchy: boolean
    readonly indexedInScopes: ImmutableList<EntityScope>

    constructor(withHierarchy: boolean, indexedInScopes: ImmutableList<EntityScope>) {
        this.withHierarchy = withHierarchy
        this.indexedInScopes = indexedInScopes
    }
}
