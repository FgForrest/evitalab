import { List, Map} from 'immutable'
import { NamingConvention } from '../NamingConvetion'
import { AttributeUniquenessType } from '@/modules/connection/model/schema/AttributeUniquenessType'
import { Value } from '@/modules/connection/model/Value'
import { Scalar } from '@/modules/connection/model/data-type/Scalar'
import { SortableSchema } from '@/modules/connection/model/schema/SortableSchema'
import { LocalizedSchema } from '@/modules/connection/model/schema/LocalizedSchema'
import { AbstractSchema } from '@/modules/connection/model/schema/AbstractSchema'
import { TypedSchema } from '@/modules/connection/model/schema/TypedSchema'

/**
 * evitaLab's representation of a single evitaDB attribute schema independent of specific evitaDB version
 */
export class AttributeSchema extends AbstractSchema implements TypedSchema, SortableSchema, LocalizedSchema {

    /**
     * Contains unique name of the model. Case-sensitive. Distinguishes one model item from another within single entity instance.
     * This is a mandatory value, it cannot be omitted.
     */
    readonly name: string
    readonly nameVariants: Value<Map<NamingConvention, string>>
    /**
     * Contains description of the model is optional but helps authors of the schema / client API to better explain the original purpose of the model to the consumers.
     */
    readonly description: Value<string | undefined>
    /**
     * Deprecation notice contains information about planned removal of this entity from the model / client API. This allows to plan and evolve the schema allowing clients to adapt early to planned breaking changes.  If notice is `null`, this schema is considered not deprecated.
     */
    readonly deprecationNotice: Value<string | undefined>
    /**
     * Data type of the attribute. Must be one of Evita-supported values. Internally the scalar is converted into Java-corresponding data type.
     */
    readonly type: Value<Scalar>
    /**
     * When attribute is unique it is automatically filterable, and it is ensured there is exactly one single entity having certain value of this attribute among other entities in the same collection.  As an example of unique attribute can be EAN - there is no sense in having two entities with same EAN, and it's better to have this ensured by the database engine.
     */
    readonly uniquenessType: Value<AttributeUniquenessType>
     /**
     * When attribute is filterable, it is possible to filter entities by this attribute. Do not mark attribute as filterable unless you know that you'll search entities by this attribute. Each filterable attribute occupies (memory/disk) space in the form of index.  When attribute is filterable, extra result `attributeHistogram` can be requested for this attribute.
     */
    readonly filterable: Value<boolean>
    /**
     * When attribute is sortable, it is possible to sort entities by this attribute. Do not mark attribute as sortable unless you know that you'll sort entities along this attribute. Each sortable attribute occupies (memory/disk) space in the form of index..
     */
    readonly sortable: Value<boolean>
    /**
     * When attribute is nullable, its values may be missing in the entities. Otherwise, the system will enforce non-null checks upon upserting of the entity.
     */
    readonly nullable: Value<boolean>
    /**
     * Default value is used when the entity is created without this attribute specified. Default values allow to pass non-null checks even if no attributes of such name are specified.
     */
    readonly defaultValue: Value<any | any[] | null>
    /**
     * When attribute is localized, it has to be ALWAYS used in connection with specific `Locale`.
     */
    readonly localized: Value<boolean>
    /**
     * Determines how many fractional places are important when entities are compared during filtering or sorting. It is significant to know that all values of this attribute will be converted to `Int`, so the attribute number must not ever exceed maximum limits of `Int` type when scaling the number by the power of ten using `indexedDecimalPlaces` as exponent.
     */
    readonly indexedDecimalPlaces: Value<number>

    protected _representativeFlags?: List<string>

    constructor(name: string,
                nameVariants: Value<Map<NamingConvention, string>>,
                description: Value<string | undefined>,
                deprecationNotice: Value<string | undefined>,
                type: Value<Scalar>,
                uniquenessType: Value<AttributeUniquenessType>,
                filterable: Value<boolean>,
                sortable: Value<boolean>,
                nullable: Value<boolean>,
                defaultValue: Value<any | any[] | undefined>,
                localized: Value<boolean>,
                indexedDecimalPlaces: Value<number>) {
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

            this.type.ifSupported(type =>
                representativeFlags.push(this.formatDataTypeForFlag(type)))

            this.uniquenessType.ifSupported(uniquenessType => {
                if (uniquenessType === AttributeUniquenessType.UniqueWithinCollection) {
                    representativeFlags.push(AttributeSchemaFlag.Unique)
                } else if (uniquenessType === AttributeUniquenessType.UniqueWithinCollectionLocale) {
                    representativeFlags.push(AttributeSchemaFlag.UniquePerLocale)
                }
            })

            if (this.sortable.getOrElse(false)) representativeFlags.push(AttributeSchemaFlag.Sortable)
            if (this.localized.getOrElse(false)) representativeFlags.push(AttributeSchemaFlag.Localized)
            if (this.nullable.getOrElse(false)) representativeFlags.push(AttributeSchemaFlag.Nullable)

            this._representativeFlags = List(representativeFlags)
            // return List(representativeFlags)
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
