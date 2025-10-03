import { List as ImmutableList } from 'immutable'
import type { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope.ts'
import type {
    ReferenceSortableAttributeCompoundSchemaMutation
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/sortableAttributeCompound/ReferenceSortableAttributeCompoundSchemaMutation.ts'

export class SetSortableAttributeCompoundIndexedMutation implements ReferenceSortableAttributeCompoundSchemaMutation{
    readonly name: string
    readonly indexedInScopes: ImmutableList<EntityScope>

    constructor(name: string, indexedInScopes: ImmutableList<EntityScope>) {
        this.name = name
        this.indexedInScopes = indexedInScopes
    }
}
