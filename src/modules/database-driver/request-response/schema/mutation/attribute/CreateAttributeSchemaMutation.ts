import  {
    type ScopedAttributeUniquenessType
} from '@/modules/database-driver/request-response/schema/ScopedAttributeUniquenessType.ts'
import Immutable, { List as ImmutableList } from 'immutable'
import  { type EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope.ts'

export class CreateAttributeSchemaMutation {
    readonly name: string
    readonly description: string
    readonly deprecationNotice: string
    readonly uniqueInScopes: ImmutableList<ScopedAttributeUniquenessType>
    readonly filterableInScopes: ImmutableList<EntityScope>
    readonly sortableInScopes: ImmutableList<EntityScope>
    readonly localized: boolean
    readonly nullable: boolean
    readonly representative: boolean
    readonly type: any
    readonly defaultValue: any
    readonly indexedDecimalPlaces: number


    constructor(name: string, description: string, deprecationNotice: string, uniqueInScopes: Immutable.List<ScopedAttributeUniquenessType>, filterableInScopes: Immutable.List<EntityScope>, sortableInScopes: Immutable.List<EntityScope>, localized: boolean, nullable: boolean, representative: boolean, type: any, defaultValue: any, indexedDecimalPlaces: number) {
        this.name = name
        this.description = description
        this.deprecationNotice = deprecationNotice
        this.uniqueInScopes = uniqueInScopes
        this.filterableInScopes = filterableInScopes
        this.sortableInScopes = sortableInScopes
        this.localized = localized
        this.nullable = nullable
        this.representative = representative
        this.type = type
        this.defaultValue = defaultValue
        this.indexedDecimalPlaces = indexedDecimalPlaces
    }
}
