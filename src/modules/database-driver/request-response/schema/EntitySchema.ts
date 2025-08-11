import { List, Map } from 'immutable'
import { NamingConvention } from '../NamingConvetion'
import { AbstractSchema } from '@/modules/database-driver/request-response/schema/AbstractSchema'
import { Locale } from '@/modules/database-driver/data-type/Locale'
import { Currency } from '@/modules/database-driver/data-type/Currency'
import { EvolutionMode } from '@/modules/database-driver/request-response/schema/EvolutionMode'
import { EntityAttributeSchema } from '@/modules/database-driver/request-response/schema/EntityAttributeSchema'
import {
    SortableAttributeCompoundSchema
} from '@/modules/database-driver/request-response/schema/SortableAttributeCompoundSchema'
import { AssociatedDataSchema } from '@/modules/database-driver/request-response/schema/AssociatedDataSchema'
import { ReferenceSchema } from '@/modules/database-driver/request-response/schema/ReferenceSchema'
import { Flag } from '@/modules/schema-viewer/viewer/model/Flag.ts'

/**
 * evitaLab's representation of a single evitaDB entity schema independent of specific evitaDB version
 */
export class EntitySchema extends AbstractSchema {

    /**
     * Contains version of this definition object and gets increased with any entity type update. Allows to execute optimistic locking i.e. avoiding parallel modifications.
     */
    readonly version: number
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
     * Contains `true` when primary keys of entities of this type will not be provided by the external systems and Evita is responsible for generating unique primary keys for the entity on insertion.  Generated key is guaranteed to be unique, but may not represent continuous ascending series. Generated key will be always greater than zero.
     */
    readonly withGeneratedPrimaryKey: boolean
    /**
     * Contains `true` when entities of this type are organized in a tree like structure (hierarchy) where certain entities are subordinate of other entities.  Entities may be organized in hierarchical fashion. That means that entity may refer to single parent entity and may be referred by multiple child entities. Hierarchy is always composed of entities of same type. Each entity must be part of at most single hierarchy (tree).  Hierarchy can limit returned entities by using filtering constraints. It's also used for computation of extra data - such as `hierarchyParentsOfSelf`. It can also invert type of returned entities in case extra result `hierarchyOfSelf` is requested.
     */
    readonly withHierarchy: boolean
    /**
     * Contains `true` when entities of this type holds price information.  Prices are specific to a very few entities, but because correct price computation is very complex in e-commerce systems and highly affects performance of the entities filtering and sorting, they deserve first class support in entity model. It is pretty common in B2B systems single product has assigned dozens of prices for the different customers.  Specifying prices on entity allows usage of `priceValidIn`, `priceInCurrency` `priceBetween`, and `priceInPriceLists` filtering constraints and also `priceNatural`, ordering of the entities. Additional extra result `priceHistogram` and requirement `priceType` can be used in query as well.
     */
    readonly withPrice: boolean
    /**
     * Determines how many fractional places are important when entities are compared during filtering or sorting. It is important to know that all prices will be converted to `Int`, so any of the price values (either with or without tax) must not ever exceed maximum limits of `Int` type when scaling the number by the power of ten using `indexedPricePlaces` as exponent.
     */
    readonly indexedPricePlaces: number
    /**
     * Contains set of all `Locale` that could be used for localized `AttributeSchema` or `AssociatedDataSchema`. Enables using `entityLocaleEquals` filtering constraint in query.
     */
    readonly locales: List<Locale>
    /**
     * Contains set of all `Currency` that could be used for `prices` in entities of this type.
     */
    readonly currencies: List<Currency>
    /**
     * Evolution mode allows to specify how strict is evitaDB when unknown information is presented to her for the first time. When no evolution mode is set, each violation of the `EntitySchema` is reported by an exception. This behaviour can be changed by this evolution mode however.
     */
    readonly evolutionMode: List<EvolutionMode>

    // todo lho maybe add getter methods that will throw exception when particular item doesnt exist under specified name
    readonly attributes: Map<string, EntityAttributeSchema>
    readonly sortableAttributeCompounds: Map<string, SortableAttributeCompoundSchema>
    readonly associatedData: Map<string, AssociatedDataSchema>
    readonly references: Map<string, ReferenceSchema>
    private _representativeFlags?: List<Flag>

    constructor(version: number,
                name: string,
                nameVariants: Map<NamingConvention, string>,
                description: string | undefined,
                deprecationNotice: string | undefined,
                withGeneratedPrimaryKey: boolean,
                withHierarchy: boolean,
                withPrice: boolean,
                indexedPricePlaces: number,
                locales: Locale[],
                currencies: Currency[],
                evolutionMode: EvolutionMode[],
                attributes: EntityAttributeSchema[],
                sortableAttributeCompounds: SortableAttributeCompoundSchema[],
                associatedData: AssociatedDataSchema[],
                references: ReferenceSchema[]) {
        super()
        this.version = version
        this.name = name
        this.nameVariants = nameVariants
        this.description = description
        this.deprecationNotice = deprecationNotice
        this.withGeneratedPrimaryKey = withGeneratedPrimaryKey
        this.withHierarchy = withHierarchy
        this.withPrice = withPrice
        this.indexedPricePlaces = indexedPricePlaces
        this.locales = List(locales)
        this.currencies = List(currencies)
        this.evolutionMode = List(evolutionMode)
        this.attributes = Map(attributes.map(attribute => [attribute.name, attribute]))
        this.sortableAttributeCompounds = Map(sortableAttributeCompounds.map(sac => [sac.name, sac]))
        this.associatedData = Map(associatedData.map(ad => [ad.name, ad]))
        this.references = Map(references.map(reference => [reference.name, reference]))
    }

    get representativeFlags(): List<Flag> {
        if (this._representativeFlags == undefined) {
            const representativeFlags: Flag[] = []
            if (this.withHierarchy) representativeFlags.push(new Flag(EntitySchemaFlag.Hierarchical))
            this._representativeFlags = List(representativeFlags)
        }
        return this._representativeFlags
    }
}

/**
 * Supported representative flags for entity schema
 */
export enum EntitySchemaFlag {
    Hierarchical = '_entitySchema.hierarchical'
}
