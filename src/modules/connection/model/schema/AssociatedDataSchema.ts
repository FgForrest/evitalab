import { List, Map} from 'immutable'
import { NamingConvention } from '../NamingConvetion'
import { Value } from '@/modules/connection/model/Value'
import { Scalar } from '@/modules/connection/model/data-type/Scalar'
import { LocalizedSchema } from '@/modules/connection/model/schema/LocalizedSchema'
import { AbstractSchema } from '@/modules/connection/model/schema/AbstractSchema'
import { TypedSchema } from '@/modules/connection/model/schema/TypedSchema'

/**
 * evitaLab's representation of a single evitaDB associated data schema independent of specific evitaDB version
 */
export class AssociatedDataSchema extends AbstractSchema implements TypedSchema, LocalizedSchema {

    /**
     * Contains unique name of the model. Case-sensitive. Distinguishes one model item from another within single entity instance.
     * This is a mandatory value, it cannot be omitted.
     */
    readonly name: string
    /**
     * Contains name variants
     */
    readonly nameVariants: Value<Map<NamingConvention, string>>
    /**
     * Contains description of the model is optional but helps authors of the schema / client API to better explain the original purpose of the model to the consumers.
     */
    readonly description: Value<string | null>
    /**
     * Deprecation notice contains information about planned removal of this entity from the model / client API. This allows to plan and evolve the schema allowing clients to adapt early to planned breaking changes.  If notice is `null`, this schema is considered not deprecated.
     */
    readonly deprecationNotice: Value<string | null>
    /**
     * Data type of the associated data. Must be one of Evita-supported values. Internally the type is converted into Java-corresponding data type. The type may be scalar type or may represent complex object type (JSON).
     */
    readonly type: Value<Scalar>
    /**
     * When associated data is nullable, its values may be missing in the entities. Otherwise, the system will enforce non-null checks upon upserting of the entity.
     */
    readonly nullable: Value<boolean>

    /**
     * Localized associated data has to be ALWAYS used in connection with specific `Locale`. In other words - it cannot be stored unless associated locale is also provided.
     */
    readonly localized: Value<boolean>

    protected _representativeFlags?: List<string>

    constructor(name: string,
                nameVariants: Value<Map<NamingConvention, string>>,
                description: Value<string | null>,
                deprecationNotice: Value<string | null>,
                type: Value<Scalar>,
                nullable: Value<boolean>,
                localized: Value<boolean>) {
        super()
        this.name = name
        this.nameVariants = nameVariants.map(it => Map(it))
        this.description = description
        this.deprecationNotice = deprecationNotice
        this.type = type
        this.nullable = nullable
        this.localized = localized
    }

    get representativeFlags(): List<string> {
        if (this._representativeFlags == undefined) {
            const representativeFlags: string[] = []

            this.type.ifSupported(type =>
                representativeFlags.push(this.formatDataTypeForFlag(type)))

            if (this.localized.getOrElse(false)) representativeFlags.push(AssociatedDataSchemaFlag.Localized)
            if (this.nullable.getOrElse(false)) representativeFlags.push(AssociatedDataSchemaFlag.Nullable)

            this._representativeFlags = List(representativeFlags)
        }
        return this._representativeFlags
    }
}

/**
 * Supported representative flags for associated data schema
 */
export enum AssociatedDataSchemaFlag {
    Localized = '_associatedDataSchema.localized',
    Nullable = '_associatedDataSchema.nullable'
}
