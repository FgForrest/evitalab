import { List as ImmutableList } from 'immutable'
import type { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope.ts'
import type {
    AttributeElement
} from '@/modules/database-driver/request-response/schema/SortableAttributeCompoundSchema.ts'
import type {
    SortableAttributeCompoundSchemaMutation
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/SortableAttributeCompoundSchemaMutation.ts'
import type {
    ReferenceSortableAttributeCompoundSchemaMutation
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/sortableAttributeCompound/ReferenceSortableAttributeCompoundSchemaMutation.ts'

export class CreateSortableAttributeCompoundSchemaMutation implements ReferenceSortableAttributeCompoundSchemaMutation {
    readonly name: string
    readonly description: string | undefined
    readonly deprecationNotice: string | undefined
    readonly indexedInScopes: ImmutableList<EntityScope>
    readonly attributeElements: ImmutableList<AttributeElement>

    constructor(name: string, description: string | undefined, deprecationNotice: string | undefined, indexedInScopes: ImmutableList<EntityScope>, attributeElements: ImmutableList<AttributeElement>) {
        this.name = name
        this.description = description
        this.deprecationNotice = deprecationNotice
        this.indexedInScopes = indexedInScopes
        this.attributeElements = attributeElements
    }
}
