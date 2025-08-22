import  { type Cardinality } from '@/modules/database-driver/request-response/schema/Cardinality.ts'
import Immutable, { List as ImmutableList } from 'immutable'
import  { type EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope.ts'
import  {
    type AttributeInheritanceBehavior
} from '@/modules/database-driver/request-response/schema/AttributeInheritanceBehavior.ts'

export class CreateReflectedReferenceSchemaMutation {
    readonly name: string
    readonly description: string
    readonly deprecationNotice: string
    readonly cardinality: Cardinality
    readonly referencedEntityType: string
    readonly reflectedReferenceName: string
    readonly indexedInScopes: ImmutableList<EntityScope>
    readonly facetedInScopes: ImmutableList<EntityScope>
    readonly attributeInheritanceBehavior: AttributeInheritanceBehavior
    readonly attributeInheritanceFilter: ImmutableList<string>


    constructor(name: string, description: string, deprecationNotice: string, cardinality: Cardinality, referencedEntityType: string, reflectedReferenceName: string, indexedInScopes: Immutable.List<EntityScope>, facetedInScopes: Immutable.List<EntityScope>, attributeInheritanceBehavior: AttributeInheritanceBehavior, attributeInheritanceFilter: Immutable.List<string>) {
        this.name = name
        this.description = description
        this.deprecationNotice = deprecationNotice
        this.cardinality = cardinality
        this.referencedEntityType = referencedEntityType
        this.reflectedReferenceName = reflectedReferenceName
        this.indexedInScopes = indexedInScopes
        this.facetedInScopes = facetedInScopes
        this.attributeInheritanceBehavior = attributeInheritanceBehavior
        this.attributeInheritanceFilter = attributeInheritanceFilter
    }
}
