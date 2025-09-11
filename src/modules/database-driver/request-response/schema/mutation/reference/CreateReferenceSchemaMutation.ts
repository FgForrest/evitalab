import  { type Cardinality } from '@/modules/database-driver/request-response/schema/Cardinality.ts'
import Immutable, { List as ImmutableList } from 'immutable'
import  { type EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope.ts'

export class CreateReferenceSchemaMutation {
    readonly name: string
    readonly description: string
    readonly deprecationNotice: string
    readonly cardinality: Cardinality
    readonly referencedEntityType: string
    readonly referencedEntityTypeManaged: boolean
    readonly referencedGroupType: string
    readonly referencedGroupTypeManaged: boolean
    readonly indexedInScopes: ImmutableList<EntityScope>
    readonly facetedInScopes: ImmutableList<EntityScope>


    constructor(name: string, description: string, deprecationNotice: string, cardinality: Cardinality, referencedEntityType: string, referencedEntityTypeManaged: boolean, referencedGroupType: string, referencedGroupTypeManaged: boolean, indexedInScopes: Immutable.List<EntityScope>, facetedInScopes: Immutable.List<EntityScope>) {
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
