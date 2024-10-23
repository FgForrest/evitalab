import { AttributeSchemaFlag } from '@/modules/connection/model/schema/AttributeSchema'
import { List, Map } from 'immutable'
import { AttributeUniquenessType } from '@/modules/connection/model/schema/AttributeUniquenessType'
import { GlobalAttributeUniquenessType } from '@/modules/connection/model/schema/GlobalAttributeUniquenessType'
import { NamingConvention } from '../NamingConvetion'
import { Value } from '@/modules/connection/model/Value'
import { EntityAttributeSchema } from '@/modules/connection/model/schema/EntityAttributeSchema'
import { Scalar } from '@/modules/connection/model/data-type/Scalar'

/**
 * evitaLab's representation of a single evitaDB global attribute schema independent of specific evitaDB version
 */
export class GlobalAttributeSchema extends EntityAttributeSchema {

    /**
     * When attribute is unique globally it is automatically filterable, and it is ensured there is exactly one single          entity having certain value of this attribute in entire catalog.           As an example of unique attribute can be URL - there is no sense in having two entities with same URL, and it's          better to have this ensured by the database engine.
     */
    readonly globalUniquenessType: Value<GlobalAttributeUniquenessType>

    constructor(name: string,
                nameVariants: Value<Map<NamingConvention, string>>,
                description: Value<string | undefined>,
                deprecationNotice: Value<string | undefined>,
                type: Value<Scalar>,
                uniquenessType: Value<AttributeUniquenessType>,
                filterable: Value<boolean>,
                sortable: Value<boolean>,
                nullable: Value<boolean>,
                defaultValue: Value<any>,
                localized: Value<boolean>,
                indexedDecimalPlaces: Value<number>,
                representative: Value<boolean>,
                globalUniquenessType: Value<GlobalAttributeUniquenessType>) {
        super(name, nameVariants, description, deprecationNotice, type, uniquenessType, filterable, sortable, nullable, defaultValue, localized, indexedDecimalPlaces, representative)
        this.globalUniquenessType = globalUniquenessType
    }

    get representativeFlags(): List<string> {
        if (this._representativeFlags == undefined) {
            const representativeFlags: string[] = []

            this.type.ifSupported(type => representativeFlags.push(this.formatDataTypeForFlag(type)))

            const globalUniquenessType = this.globalUniquenessType.getOrElse(GlobalAttributeUniquenessType.NotUnique)
            const uniquenessType = this.uniquenessType.getOrElse(AttributeUniquenessType.NotUnique)
            if (globalUniquenessType === GlobalAttributeUniquenessType.UniqueWithinCatalog) {
                representativeFlags.push(GlobalAttributeSchemaFlag.GloballyUnique)
            } else if (globalUniquenessType === GlobalAttributeUniquenessType.UniqueWithinCatalogLocale) {
                representativeFlags.push(GlobalAttributeSchemaFlag.GloballyUniquePerLocale)
            } else if (uniquenessType === AttributeUniquenessType.UniqueWithinCollection) {
                representativeFlags.push(AttributeSchemaFlag.Unique)
            } else if (uniquenessType === AttributeUniquenessType.UniqueWithinCollectionLocale) {
                representativeFlags.push(AttributeSchemaFlag.UniquePerLocale)
            }
            if (globalUniquenessType != GlobalAttributeUniquenessType.NotUnique ||
                uniquenessType != AttributeUniquenessType.NotUnique ||
                this.filterable.getOrElse(false))
                representativeFlags.push(AttributeSchemaFlag.Filterable)

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
 * Specific supported representative flags for global attribute schema
 */
export enum GlobalAttributeSchemaFlag {
    GloballyUnique = '_attributeSchema.globallyUnique',
    GloballyUniquePerLocale = '_attributeSchema.globallyUniquePerLocale',
}
