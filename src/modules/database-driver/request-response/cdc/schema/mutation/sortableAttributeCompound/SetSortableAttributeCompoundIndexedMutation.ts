import { List as ImmutableList } from 'immutable'
import type { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope.ts'

export class SetSortableAttributeCompoundIndexedMutation {
    readonly name: string
    readonly indexedInScopes: ImmutableList<EntityScope>

    constructor(name: string, indexedInScopes: ImmutableList<EntityScope>) {
        this.name = name
        this.indexedInScopes = indexedInScopes
    }
}
