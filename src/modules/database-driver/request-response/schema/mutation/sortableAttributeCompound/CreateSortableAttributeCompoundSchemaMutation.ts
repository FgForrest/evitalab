import { List as ImmutableList } from "immutable"
import type { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope.ts'
import type {
    AttributeElement
} from '@/modules/database-driver/request-response/schema/SortableAttributeCompoundSchema.ts'

export class CreateSortableAttributeCompoundSchemaMutation {
    readonly name: string
    readonly description: string
    readonly deprecationNotice: string
    readonly indexedInScopes: ImmutableList<EntityScope>
    readonly attributeElements: ImmutableList<AttributeElement>

    constructor(name: string, description: string, deprecationNotice: string, indexedInScopes: ImmutableList<EntityScope>, attributeElements: ImmutableList<AttributeElement>) {
        this.name = name
        this.description = description
        this.deprecationNotice = deprecationNotice
        this.indexedInScopes = indexedInScopes
        this.attributeElements = attributeElements
    }
}
