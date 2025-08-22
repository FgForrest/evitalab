import { List as ImmutableList } from 'immutable'
import type { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope.ts'

export class SetAttributeSchemaFilterableMutation {
    readonly name: string
    readonly filterableInScopes: ImmutableList<EntityScope>

    constructor(name: string, filterableInScopes: ImmutableList<EntityScope>) {
        this.name = name
        this.filterableInScopes = filterableInScopes
    }
}
