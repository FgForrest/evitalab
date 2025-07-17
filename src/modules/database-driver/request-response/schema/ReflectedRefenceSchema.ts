import  {
    type AttributeInheritanceBehavior
} from '@/modules/database-driver/request-response/schema/AttributeInheritanceBehavior.ts'
import { ReferenceSchema } from '@/modules/database-driver/request-response/schema/ReferenceSchema.ts'
import { Map } from 'immutable'
import { NamingConvention } from '@/modules/database-driver/request-response/NamingConvetion.ts'
import { Cardinality } from '@/modules/database-driver/request-response/schema/Cardinality.ts'
import { AttributeSchema } from '@/modules/database-driver/request-response/schema/AttributeSchema.ts'
import {
    SortableAttributeCompoundSchema
} from '@/modules/database-driver/request-response/schema/SortableAttributeCompoundSchema.ts'

export class ReflectedRefenceSchema extends ReferenceSchema {
    readonly reflectedReferenceName?: string;
    readonly descriptionInherited: boolean;
    readonly deprecationNoticeInherited: boolean;
    readonly cardinalityInherited: boolean;
    readonly facetedInherited: boolean;
    readonly indexedInherited: boolean;
    readonly attributeInheritanceBehavior: AttributeInheritanceBehavior
    readonly attributeInheritanceFilter: string[]
    private _reflectedType?: string

    constructor(name: string,
                nameVariants: Map<NamingConvention, string>,
                description: string | undefined,
                deprecationNotice: string | undefined,
                entityType: string,
                referencedEntityTypeManaged: boolean,
                entityTypeNameVariants: Map<NamingConvention, string>,
                referencedGroupType: string | undefined,
                referencedGroupTypeManaged: boolean | undefined,
                groupTypeNameVariants: Map<NamingConvention, string> | undefined,
                indexed: boolean,
                faceted: boolean,
                cardinality: Cardinality,
                attributes: AttributeSchema[],
                sortableAttributeCompounds: SortableAttributeCompoundSchema[],
                reflectedReferenceName: string,
                descriptionInherited: boolean,
                deprecationNoticeInherited: boolean,
                cardinalityInherited: boolean,
                facetedInherited: boolean,
                indexedInherited: boolean,
                attributeInheritanceBehavior: AttributeInheritanceBehavior,
                attributeInheritanceFilter: string[]) {
        super(name, nameVariants, description, deprecationNotice, entityType, referencedEntityTypeManaged,
            entityTypeNameVariants, referencedGroupType, referencedGroupTypeManaged, groupTypeNameVariants, indexed,
            faceted, cardinality, attributes, sortableAttributeCompounds)
        this.reflectedReferenceName = reflectedReferenceName
        this.descriptionInherited = descriptionInherited
        this.deprecationNoticeInherited = deprecationNoticeInherited
        this.cardinalityInherited = cardinalityInherited
        this.facetedInherited = facetedInherited
        this.indexedInherited = indexedInherited
        this.attributeInheritanceBehavior = attributeInheritanceBehavior
        this.attributeInheritanceFilter = attributeInheritanceFilter
    }


    get reflectedType(): string | undefined {
        return this._reflectedType
    }

    set reflectedType(value: string) {
        this._reflectedType = value
    }
}
