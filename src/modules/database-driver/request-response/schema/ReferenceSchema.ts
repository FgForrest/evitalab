import { List, Map } from 'immutable'
import { NamingConvention } from '../NamingConvetion'
import { AbstractSchema } from '@/modules/database-driver/request-response/schema/AbstractSchema'
import { Cardinality } from '@/modules/database-driver/request-response/schema/Cardinality'
import { AttributeSchema } from '@/modules/database-driver/request-response/schema/AttributeSchema'
import {
    SortableAttributeCompoundSchema
} from '@/modules/database-driver/request-response/schema/SortableAttributeCompoundSchema'
import { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope.ts'
import { Flag } from '@/modules/schema-viewer/viewer/model/Flag.ts'
import { useI18n } from 'vue-i18n'
import { getEnumKeyByValue } from '@/utils/enum.ts'

/**
 * evitaLab's representation of a single evitaDB reference schema independent of specific evitaDB version
 */
export class ReferenceSchema extends AbstractSchema {

    /**
     * Contains unique name of the model. Case-sensitive. Distinguishes one model item from another within single entity instance.
     * This is a mandatory value, it cannot be omitted.
     */
    readonly name: string
    readonly nameVariants: Map<NamingConvention, string>
    /**
     * Contains description of the model is optional but helps authors of the schema / client API to better explain the original purpose of the model to the consumers.
     */
    readonly description: string | undefined
    /**
     * Deprecation notice contains information about planned removal of this entity from the model / client API. This allows to plan and evolve the schema allowing clients to adapt early to planned breaking changes.  If notice is `null`, this schema is considered not deprecated.
     */
    readonly deprecationNotice: string | undefined

    /**
     * Reference to `Entity.type` of the referenced entity. Might be also any `String` that identifies type some external resource not maintained by Evita.
     */
    readonly entityType: string
    /**
     * Contains `true` if `entityType` refers to any existing entity that is maintained by Evita.
     */
    readonly referencedEntityTypeManaged: boolean
    readonly entityTypeNameVariants: Map<NamingConvention, string>

    /**
     * Reference to `Entity.type` of the referenced entity. Might be also `String` that identifies type some external resource not maintained by Evita.
     */
    readonly referencedGroupType: string | undefined
    /**
     * Contains `true` if `groupType` refers to any existing entity that is maintained by Evita.
     */
    readonly referencedGroupTypeManaged: boolean | undefined
    readonly groupTypeNameVariants: Map<NamingConvention, string> | undefined

    readonly cardinality: Cardinality

    /**
     * Attributes related to reference allows defining set of data that are fetched in bulk along with the entity body. Attributes may be indexed for fast filtering (`AttributeSchema.filterable`) or can be used to sort along (`AttributeSchema.filterable`). Attributes are not automatically indexed in order not to waste precious memory space for data that will never be used in search queries.  Filtering in attributes is executed by using constraints like `and`, `not`, `attribute_{name}_equals`, `attribute_{name}_contains` and many others. Sorting can be achieved with `attribute_{name}_natural` or others.  Attributes are not recommended for bigger data as they are all loaded at once.
     */
    readonly attributes: Map<string, AttributeSchema>
    /**
     * Contains definitions of all sortable attribute compounds defined in this schema.
     */
    readonly sortableAttributeCompounds: Map<string, SortableAttributeCompoundSchema>
    readonly indexedInScopes: List<EntityScope>
    readonly facetedInScopes: List<EntityScope>

    private _representativeFlags?: List<Flag>

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
                cardinality: Cardinality,
                attributes: AttributeSchema[],
                sortableAttributeCompounds: SortableAttributeCompoundSchema[],
                indexedInScopes: List<EntityScope>,
                facetedInScopes: List<EntityScope>) {
        super()
        this.name = name
        this.nameVariants = nameVariants
        this.description = description
        this.deprecationNotice = deprecationNotice
        this.entityType = entityType
        this.referencedEntityTypeManaged = referencedEntityTypeManaged
        this.entityTypeNameVariants = entityTypeNameVariants
        this.referencedGroupType = referencedGroupType
        this.referencedGroupTypeManaged = referencedGroupTypeManaged
        this.groupTypeNameVariants = groupTypeNameVariants
        this.cardinality = cardinality
        this.attributes = Map(attributes.map(attribute => [attribute.name, attribute]))
        this.sortableAttributeCompounds = Map(sortableAttributeCompounds.map(sac => [sac.name, sac]))
        this.indexedInScopes = indexedInScopes
        this.facetedInScopes = facetedInScopes
    }

    get representativeFlags(): List<Flag> {
        if (this._representativeFlags == null) {
            const { t } = useI18n()
            const representativeFlags: Flag[] = []

            if (!this.referencedEntityTypeManaged) representativeFlags.push(new Flag(ReferenceSchemaFlag.External))
            if (this.indexedInScopes.size > 0) representativeFlags.push(new Flag(ReferenceSchemaFlag.Indexed, this.indexedInScopes.map(x => x).toArray(), t('schemaViewer.reference.tooltip.content', ['', this.indexedInScopes.map(z => t(`schemaViewer.tooltip.${getEnumKeyByValue(EntityScope, z).toLowerCase()}`)).join('/')])))
            if (this.facetedInScopes.size > 0) representativeFlags.push(new Flag(ReferenceSchemaFlag.Faceted, this.facetedInScopes.map(x => x).toArray(), t('schemaViewer.reference.tooltip.facetedContent', ['', this.facetedInScopes.map(z => t(`schemaViewer.tooltip.${getEnumKeyByValue(EntityScope, z).toLowerCase()}`)).join('/')])))

            this._representativeFlags = List(representativeFlags)
        }
        return this._representativeFlags
    }
}

/**
 * Supported representative flags for reference schema
 */
export enum ReferenceSchemaFlag {
    External = '_referenceSchema.external',
    Indexed = '_referenceSchema.indexed',
    Faceted = '_referenceSchema.faceted'
}
