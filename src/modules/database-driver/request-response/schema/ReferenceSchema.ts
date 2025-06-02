import { List, Map } from 'immutable'
import { NamingConvention } from '../NamingConvetion'
import { AbstractSchema } from '@/modules/database-driver/request-response/schema/AbstractSchema'
import { Cardinality } from '@/modules/database-driver/request-response/schema/Cardinality'
import { AttributeSchema } from '@/modules/database-driver/request-response/schema/AttributeSchema'
import {
    SortableAttributeCompoundSchema
} from '@/modules/database-driver/request-response/schema/SortableAttributeCompoundSchema'

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

    /**
     * Contains `true` if the index for this reference should be created and maintained allowing to filter by `reference_{reference name}_having` filtering constraints. Index is also required when reference is `faceted`.  Do not mark reference as faceted unless you know that you'll need to filter/sort entities by this reference. Each indexed reference occupies (memory/disk) space in the form of index. When reference is not indexed, the entity cannot be looked up by reference attributes or relation existence itself, but the data can be fetched.
     */
    readonly indexed: boolean
    /**
     * Contains `true` if the statistics data for this reference should be maintained and this allowing to get `facetStatistics` for this reference or use `facet_{reference name}_inSet` filtering constraint.  Do not mark reference as faceted unless you want it among `facetStatistics`. Each faceted reference occupies (memory/disk) space in the form of index.  Reference that was marked as faceted is called Facet.
     */
    readonly faceted: boolean
    readonly cardinality: Cardinality

    /**
     * Attributes related to reference allows defining set of data that are fetched in bulk along with the entity body. Attributes may be indexed for fast filtering (`AttributeSchema.filterable`) or can be used to sort along (`AttributeSchema.filterable`). Attributes are not automatically indexed in order not to waste precious memory space for data that will never be used in search queries.  Filtering in attributes is executed by using constraints like `and`, `not`, `attribute_{name}_equals`, `attribute_{name}_contains` and many others. Sorting can be achieved with `attribute_{name}_natural` or others.  Attributes are not recommended for bigger data as they are all loaded at once.
     */
    readonly attributes: Map<string, AttributeSchema>
    /**
     * Contains definitions of all sortable attribute compounds defined in this schema.
     */
    readonly sortableAttributeCompounds: Map<string, SortableAttributeCompoundSchema>

    private _representativeFlags?: List<string>

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
                sortableAttributeCompounds: SortableAttributeCompoundSchema[]) {
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
        this.indexed = indexed
        this.faceted = faceted
        this.cardinality = cardinality
        this.attributes = Map(attributes.map(attribute => [attribute.name, attribute]))
        this.sortableAttributeCompounds = Map(sortableAttributeCompounds.map(sac => [sac.name, sac]))
    }

    get representativeFlags(): List<string> {
        if (this._representativeFlags == null) {
            const representativeFlags: string[] = []

            if (!this.referencedEntityTypeManaged) representativeFlags.push(ReferenceSchemaFlag.External)
            if (this.indexed) representativeFlags.push(ReferenceSchemaFlag.Indexed)
            if (this.faceted) representativeFlags.push(ReferenceSchemaFlag.Faceted)

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
