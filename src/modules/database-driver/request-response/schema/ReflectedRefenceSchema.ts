import  {
    type AttributeInheritanceBehavior
} from '@/modules/database-driver/request-response/schema/AttributeInheritanceBehavior.ts'

export class ReflectedRefenceSchema {
    readonly reflectedReferenceName?: string;
    readonly descriptionInherited: boolean;
    readonly deprecationNoticeInherited: boolean;
    readonly cardinalityInherited: boolean;
    readonly facetedInherited: boolean;
    readonly indexedInherited: boolean;
    readonly attributeInheritanceBehavior: AttributeInheritanceBehavior


    constructor(reflectedReferenceName: string, descriptionInherited: boolean, deprecationNoticeInherited: boolean, cardinalityInherited: boolean, facetedInherited: boolean, indexedInherited: boolean, attributeInheritanceBehavior: AttributeInheritanceBehavior) {
        this.reflectedReferenceName = reflectedReferenceName
        this.descriptionInherited = descriptionInherited
        this.deprecationNoticeInherited = deprecationNoticeInherited
        this.cardinalityInherited = cardinalityInherited
        this.facetedInherited = facetedInherited
        this.indexedInherited = indexedInherited
        this.attributeInheritanceBehavior = attributeInheritanceBehavior
    }
}
