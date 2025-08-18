import { EntitySchemaMutation } from '@/modules/database-driver/request-response/cdc/EntitySchemaMutation.ts'
import Immutable, { List as ImmutableList } from 'immutable'
import  {
    type ScopedAttributeUniquenessType
} from '@/modules/database-driver/request-response/schema/ScopedAttributeUniquenessType.ts'
import  { type EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope.ts'

export class CreateAttributeSchemaMutation extends EntitySchemaMutation {
    readonly kind: string = 'createAttributeSchemaMutation'
    readonly name: string
    readonly description?: string
    readonly deprecationNotice?: string
    readonly localized: boolean
    readonly nullable: boolean
    readonly representative: boolean
    readonly type: any
    readonly indexedDecimalPlaces: number
    readonly defaultValue: any
    readonly uniqueInScopes: ImmutableList<ScopedAttributeUniquenessType>
    readonly filterableInScopes: ImmutableList<EntityScope>
    readonly sortableInScopes: ImmutableList<EntityScope>


    constructor(name: string, description: string | undefined, deprecationNotice: string | undefined, localized: boolean, nullable: boolean, representative: boolean, type: any, indexedDecimalPlaces: number, defaultValue: any, uniqueInScopes: Immutable.List<ScopedAttributeUniquenessType>, filterableInScopes: Immutable.List<EntityScope>, sortableInScopes: Immutable.List<EntityScope>) {
        super()
        this.name = name
        this.description = description
        this.deprecationNotice = deprecationNotice
        this.localized = localized
        this.nullable = nullable
        this.representative = representative
        this.type = type
        this.indexedDecimalPlaces = indexedDecimalPlaces
        this.defaultValue = defaultValue
        this.uniqueInScopes = uniqueInScopes
        this.filterableInScopes = filterableInScopes
        this.sortableInScopes = sortableInScopes
    }
}
