import { List, Map } from 'immutable'
import { NamingConvention } from '../NamingConvetion'
import { AbstractSchema } from '@/modules/database-driver/request-response/schema/AbstractSchema'
import type { TypedSchema } from '@/modules/database-driver/request-response/schema/TypedSchema'
import type { LocalizedSchema } from '@/modules/database-driver/request-response/schema/LocalizedSchema'
import { Scalar } from '@/modules/database-driver/data-type/Scalar'
import { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope.ts'
import {
    type ScopedAttributeUniquenessType
} from '@/modules/database-driver/request-response/schema/ScopedAttributeUniquenessType.ts'
import { Flag } from '@/modules/schema-viewer/viewer/model/Flag.ts'
import { i18n } from '@/vue-plugins/i18n.ts'
import { getEnumKeyByValue } from '@/utils/enum.ts'

/**
 * evitaLab's representation of a single evitaDB attribute schema independent of specific evitaDB version
 */
export class AttributeSchema extends AbstractSchema implements TypedSchema, LocalizedSchema {

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
    readonly sortableInScopes: List<EntityScope>
    readonly filteredInScopes: List<EntityScope>
    readonly uniqueInScopes: List<ScopedAttributeUniquenessType>

    protected _representativeFlags?: List<Flag>

    constructor(name: string,
                nameVariants: Map<NamingConvention, string>,
                description: string | undefined,
                deprecationNotice: string | undefined,
                type: Scalar,
                nullable: boolean,
                defaultValue: any | any[] | undefined,
                localized: boolean,
                indexedDecimalPlaces: number,
                sortableInScopes: List<EntityScope>,
                filteredInScopes: List<EntityScope>,
                uniqueInScopes: List<ScopedAttributeUniquenessType>) {
        super()
        this.name = name
        this.nameVariants = nameVariants
        this.description = description
        this.deprecationNotice = deprecationNotice
        this.type = type
        this.nullable = nullable
        this.defaultValue = defaultValue
        this.localized = localized
        this.indexedDecimalPlaces = indexedDecimalPlaces
        this.sortableInScopes = sortableInScopes
        this.filteredInScopes = filteredInScopes
        this.uniqueInScopes = uniqueInScopes
    }

    get representativeFlags(): List<Flag> {
        if (this._representativeFlags == undefined) {
            const flags: Flag[] = []

            flags.push(new Flag(this.formatDataTypeForFlag(this.type)))

            if (this.sortableInScopes !== undefined && this.sortableInScopes.size > 0) {
               flags.push(new Flag(AttributeSchemaFlag.Sortable, this.sortableInScopes.toArray(), i18n.global.t('schemaViewer.attribute.tooltip.content', [i18n.global.t('schemaViewer.tooltip.sorted'), this.sortableInScopes.map(z => i18n.global.t(`schemaViewer.tooltip.${getEnumKeyByValue(EntityScope, z).toLowerCase()}`)).join('/')])))
            }
            if (this.filteredInScopes !== undefined && this.filteredInScopes.size > 0) {
                flags.push(new Flag(AttributeSchemaFlag.Filterable, this.filteredInScopes.toArray(), i18n.global.t('schemaViewer.attribute.tooltip.content', [i18n.global.t('schemaViewer.tooltip.filtered'), this.filteredInScopes.map(z => i18n.global.t(`schemaViewer.tooltip.${getEnumKeyByValue(EntityScope, z).toLowerCase()}`)).join('/')])))
            }
            if (this.nullable) {
                flags.push(new Flag(AttributeSchemaFlag.Nullable))
            }
            if (this.localized) {
                flags.push(new Flag(AttributeSchemaFlag.Localized))
            }

            this._representativeFlags = List(flags)
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
