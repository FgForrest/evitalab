import { type Cardinality } from '@/modules/database-driver/request-response/schema/Cardinality.ts'
import { List as ImmutableList } from 'immutable'
import { type EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope.ts'
import {
    type AttributeInheritanceBehavior
} from '@/modules/database-driver/request-response/schema/AttributeInheritanceBehavior.ts'
import {
    ScopedReferenceIndexType
} from '@/modules/database-driver/request-response/schema/mutation/reference/ScopedReferenceIndexType.ts'

export class CreateReflectedReferenceSchemaMutation {
    readonly name: string
    readonly description: string|undefined
    readonly deprecationNotice: string|undefined
    readonly cardinality: Cardinality|undefined
    readonly referencedEntityType: string
    readonly reflectedReferenceName: string
    readonly indexedInScopes: ImmutableList<ScopedReferenceIndexType>|undefined
    readonly facetedInScopes: ImmutableList<EntityScope>|undefined
    readonly attributeInheritanceBehavior: AttributeInheritanceBehavior
    readonly attributeInheritanceFilter: ImmutableList<string>|undefined


    constructor(name: string, description: string|undefined, deprecationNotice: string|undefined, cardinality: Cardinality|undefined, referencedEntityType: string, reflectedReferenceName: string, indexedInScopes: ImmutableList<ScopedReferenceIndexType>|undefined, facetedInScopes: ImmutableList<EntityScope>|undefined, attributeInheritanceBehavior: AttributeInheritanceBehavior, attributeInheritanceFilter: ImmutableList<string>|undefined) {
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
