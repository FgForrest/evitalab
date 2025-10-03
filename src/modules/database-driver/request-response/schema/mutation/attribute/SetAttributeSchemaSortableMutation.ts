import { List as ImmutableList } from "immutable"
import type { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope.ts'

export class SetAttributeSchemaSortableMutation {
    readonly name: string
    readonly sortableInScopes: ImmutableList<EntityScope>

    constructor(name: string, sortableInScopes: ImmutableList<EntityScope>) {
        this.name = name
        this.sortableInScopes = sortableInScopes
    }
}
