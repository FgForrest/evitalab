import {
    AttributeInheritanceBehavior
} from '@/modules/database-driver/request-response/schema/AttributeInheritanceBehavior.ts'
import {
    ReferenceSchema
} from '@/modules/database-driver/request-response/schema/ReferenceSchema.ts'
import { Map, List as ImmutableList } from 'immutable'
import { NamingConvention } from '@/modules/database-driver/request-response/NamingConvetion.ts'
import { Cardinality } from '@/modules/database-driver/request-response/schema/Cardinality.ts'
import { AttributeSchema } from '@/modules/database-driver/request-response/schema/AttributeSchema.ts'
import {
    SortableAttributeCompoundSchema
} from '@/modules/database-driver/request-response/schema/SortableAttributeCompoundSchema.ts'
import { i18n } from '@/vue-plugins/i18n.ts'

export class ReflectedReferenceSchema extends ReferenceSchema {
    /**
     * Contains name of the original reference of the {@link #getReferencedEntityType()} this reference reflects.
     */
    readonly reflectedReferenceName?: string;
    /**
     * Contains TRUE if the description of the reflected reference is inherited from the target reference.
     */
    readonly descriptionInherited: boolean;
    /**
     * Contains TRUE if the deprecated flag of the reflected reference is inherited from the target reference.
     */
    readonly deprecationNoticeInherited: boolean;
    /**
     * Contains TRUE if the cardinality of the reflected reference is inherited from the target reference.
     */
    readonly cardinalityInherited: boolean;
    /**
     * Contains TRUE if the faceted scopes of the reflected reference is inherited from the target reference.
     */
    readonly facetedInherited: boolean;
    /**
     * Contains TRUE if the indexed scopes of the reflected reference is inherited from the target reference.
     */
    readonly indexedInherited: boolean;
    /**
     * Contains TRUE if the attributes of the reflected reference are inherited from the target reference.
     */
    readonly attributeInheritanceBehavior: AttributeInheritanceBehavior
    /**
     * Contains the names of the attributes that are explicitly inherited / excluded from inheritance
     * based on {@link #attributesInheritanceBehavior} value.
     */
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


    get representativeFlags(): ImmutableList<string> {
        const flags = super.representativeFlags.toArray()
        flags.push(ReflectedReferenceSchemaFlag.ReflectedReference)
        if(this.attributeInheritanceBehavior != undefined && this.attributeInheritanceFilter) {
            if (this.attributeInheritanceFilter?.includes(this.name) && this.attributeInheritanceBehavior === AttributeInheritanceBehavior.InheritOnlySpecified) {
                flags.push(i18n.global.t('schemaViewer.reference.label.inherited'))
            } else if(!this.attributeInheritanceFilter?.includes(this.name) && this.attributeInheritanceBehavior === AttributeInheritanceBehavior.InheritAllExcept) {
                flags.push(i18n.global.t('schemaViewer.reference.label.inherited'))
            }
        }
        return ImmutableList<string>(flags)
    }
}
 export enum ReflectedReferenceSchemaFlag {
    ReflectedReference = '_reflectedReferenceSchema.reflectedReference',
 }
