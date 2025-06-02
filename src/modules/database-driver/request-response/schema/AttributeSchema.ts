import { List, Map} from 'immutable'
import { NamingConvention } from '../NamingConvetion'
import { AbstractSchema } from '@/modules/database-driver/request-response/schema/AbstractSchema'
import { TypedSchema } from '@/modules/database-driver/request-response/schema/TypedSchema'
import { LocalizedSchema } from '@/modules/database-driver/request-response/schema/LocalizedSchema'
import { SortableSchema } from '@/modules/database-driver/request-response/schema/SortableSchema'
import { AttributeUniquenessType } from '@/modules/database-driver/request-response/schema/AttributeUniquenessType'
import { Scalar } from '@/modules/database-driver/data-type/Scalar'

/**
 * evitaLab's representation of a single evitaDB attribute schema independent of specific evitaDB version
 */
export class AttributeSchema extends AbstractSchema implements TypedSchema, SortableSchema, LocalizedSchema {

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
     * Data type of the attribute. Must be one of Evita-supported values. Internally the scalar is converted into Java-corresponding data type.
     */
    readonly type: Scalar
    /**
     * When attribute is unique it is automatically filterable, and it is ensured there is exactly one single entity having certain value of this attribute among other entities in the same collection.  As an example of unique attribute can be EAN - there is no sense in having two entities with same EAN, and it's better to have this ensured by the database engine.
     */
    readonly uniquenessType: AttributeUniquenessType
     /**
     * When attribute is filterable, it is possible to filter entities by this attribute. Do not mark attribute as filterable unless you know that you'll search entities by this attribute. Each filterable attribute occupies (memory/disk) space in the form of index.  When attribute is filterable, extra result `attributeHistogram` can be requested for this attribute.
     */
    readonly filterable: boolean
    /**
     * When attribute is sortable, it is possible to sort entities by this attribute. Do not mark attribute as sortable unless you know that you'll sort entities along this attribute. Each sortable attribute occupies (memory/disk) space in the form of index..
     */
    readonly sortable: boolean
    /**
     * When attribute is nullable, its values may be missing in the entities. Otherwise, the system will enforce non-null checks upon upserting of the entity.
     */
    readonly nullable: boolean
    /**
     * Default value is used when the entity is created without this attribute specified. Default values allow to pass non-null checks even if no attributes of such name are specified.
     */
    readonly defaultValue: any | any[] | null
    /**
     * When attribute is localized, it has to be ALWAYS used in connection with specific `Locale`.
     */
    readonly localized: boolean
    /**
     * Determines how many fractional places are important when entities are compared during filtering or sorting. It is significant to know that all values of this attribute will be converted to `Int`, so the attribute number must not ever exceed maximum limits of `Int` type when scaling the number by the power of ten using `indexedDecimalPlaces` as exponent.
     */
    readonly indexedDecimalPlaces: number

    protected _representativeFlags?: List<string>

    constructor(name: string,
                nameVariants: Map<NamingConvention, string>,
                description: string | undefined,
                deprecationNotice: string | undefined,
                type: Scalar,
                uniquenessType: AttributeUniquenessType,
                filterable: boolean,
                sortable: boolean,
                nullable: boolean,
                defaultValue: any | any[] | undefined,
                localized: boolean,
                indexedDecimalPlaces: number) {
        super()
        this.name = name
        this.nameVariants = nameVariants
        this.description = description
        this.deprecationNotice = deprecationNotice
        this.type = type
        this.uniquenessType = uniquenessType
        this.filterable = filterable
        this.sortable = sortable
        this.nullable = nullable
        this.defaultValue = defaultValue
        this.localized = localized
        this.indexedDecimalPlaces = indexedDecimalPlaces
    }

    get representativeFlags(): List<string> {
        if (this._representativeFlags == undefined) {
            const representativeFlags: string[] = []

            representativeFlags.push(this.formatDataTypeForFlag(this.type))

            if (this.uniquenessType === AttributeUniquenessType.UniqueWithinCollection) {
                representativeFlags.push(AttributeSchemaFlag.Unique)
            } else if (this.uniquenessType === AttributeUniquenessType.UniqueWithinCollectionLocale) {
                representativeFlags.push(AttributeSchemaFlag.UniquePerLocale)
            }

            if (this.sortable) representativeFlags.push(AttributeSchemaFlag.Sortable)
            if (this.localized) representativeFlags.push(AttributeSchemaFlag.Localized)
            if (this.nullable) representativeFlags.push(AttributeSchemaFlag.Nullable)

            this._representativeFlags = List(representativeFlags)
        }
        return this._representativeFlags
    }
}

/**
 * Supported representative flags for attribute schema
 */
export enum AttributeSchemaFlag {
    Unique = '_attributeSchema.unique',
    UniquePerLocale = '_attributeSchema.uniquePerLocale',
    Filterable = '_attributeSchema.filterable',
    Sortable = '_attributeSchema.sortable',
    Localized = '_attributeSchema.localized',
    Nullable = '_attributeSchema.nullable'
}
