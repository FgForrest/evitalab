import {
    type ScopedAttributeUniquenessType
} from '@/modules/database-driver/request-response/schema/ScopedAttributeUniquenessType.ts'
import { List as ImmutableList } from 'immutable'
import { type EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope.ts'
import { type Scalar } from '@/modules/database-driver/data-type/Scalar.ts'

export class CreateAttributeSchemaMutation {
    readonly name: string
    readonly description: string | undefined
    readonly deprecationNotice: string | undefined
    readonly uniqueInScopes: ImmutableList<ScopedAttributeUniquenessType>
    readonly filterableInScopes: ImmutableList<EntityScope>
    readonly sortableInScopes: ImmutableList<EntityScope>
    readonly localized: boolean
    readonly nullable: boolean
    readonly representative: boolean
    readonly type: Scalar
    readonly defaultValue: unknown
    readonly indexedDecimalPlaces: number


    constructor(name: string, description: string | undefined, deprecationNotice: string | undefined, uniqueInScopes: ImmutableList<ScopedAttributeUniquenessType>, filterableInScopes: ImmutableList<EntityScope>, sortableInScopes: ImmutableList<EntityScope>, localized: boolean, nullable: boolean, representative: boolean, type: Scalar, defaultValue: unknown, indexedDecimalPlaces: number) {
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
