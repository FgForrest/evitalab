import { type Cardinality } from '@/modules/database-driver/request-response/schema/Cardinality.ts'
import { List as ImmutableList } from 'immutable'
import { type EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope.ts'
import {
    ScopedReferenceIndexType
} from '@/modules/database-driver/request-response/schema/mutation/reference/ScopedReferenceIndexType.ts'

export class CreateReferenceSchemaMutation {
    readonly name: string
    readonly description: string|undefined
    readonly deprecationNotice: string|undefined
    readonly cardinality: Cardinality|undefined
    readonly referencedEntityType: string
    readonly referencedEntityTypeManaged: boolean
    readonly referencedGroupType: string|undefined
    readonly referencedGroupTypeManaged: boolean
    readonly indexedInScopes: ImmutableList<ScopedReferenceIndexType>
    readonly facetedInScopes: ImmutableList<EntityScope>


    constructor(name: string, description: string|undefined, deprecationNotice: string|undefined, cardinality: Cardinality|undefined, referencedEntityType: string, referencedEntityTypeManaged: boolean, referencedGroupType: string|undefined, referencedGroupTypeManaged: boolean, indexedInScopes: ImmutableList<ScopedReferenceIndexType>, facetedInScopes: ImmutableList<EntityScope>) {
        this.name = name
        this.description = description
        this.deprecationNotice = deprecationNotice
        this.cardinality = cardinality
        this.referencedEntityType = referencedEntityType
        this.referencedEntityTypeManaged = referencedEntityTypeManaged
        this.referencedGroupType = referencedGroupType
        this.referencedGroupTypeManaged = referencedGroupTypeManaged
        this.indexedInScopes = indexedInScopes
        this.facetedInScopes = facetedInScopes
    }
}
