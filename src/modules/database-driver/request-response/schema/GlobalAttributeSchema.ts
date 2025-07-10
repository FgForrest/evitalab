import { List, Map } from 'immutable'
import { NamingConvention } from '../NamingConvetion'
import { EntityAttributeSchema } from '@/modules/database-driver/request-response/schema/EntityAttributeSchema'
import {
    GlobalAttributeUniquenessType
} from '@/modules/database-driver/request-response/schema/GlobalAttributeUniquenessType'
import { AttributeUniquenessType } from '@/modules/database-driver/request-response/schema/AttributeUniquenessType'
import { Scalar } from '@/modules/database-driver/data-type/Scalar'
import { AttributeSchemaFlag } from '@/modules/database-driver/request-response/schema/AttributeSchema'
import type { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope.ts'

/**
 * evitaLab's representation of a single evitaDB global attribute schema independent of specific evitaDB version
 */
export class GlobalAttributeSchema extends EntityAttributeSchema {

    /**
     * When attribute is unique globally it is automatically filterable, and it is ensured there is exactly one single          entity having certain value of this attribute in entire catalog.           As an example of unique attribute can be URL - there is no sense in having two entities with same URL, and it's          better to have this ensured by the database engine.
     */
    readonly globalUniquenessType: GlobalAttributeUniquenessType
    readonly uniqueGloballyInScopes: List<EntityScope>
    readonly uniqueInScopes: List<EntityScope>

    constructor(name: string,
                nameVariants: Map<NamingConvention, string>,
                description: string | undefined,
                deprecationNotice: string | undefined,
                type: Scalar,
                uniquenessType: AttributeUniquenessType,
                filterable: boolean,
                sortable: boolean,
                nullable: boolean,
                defaultValue: any,
                localized: boolean,
                indexedDecimalPlaces: number,
                representative: boolean,
                globalUniquenessType: GlobalAttributeUniquenessType,
                sortableInScopes: List<EntityScope>,
                filterableInScopes: List<EntityScope>,
                uniqueGloballyInScopes: List<EntityScope>,
                uniqueInScopes: List<EntityScope>) {
        super(name, nameVariants, description, deprecationNotice, type, uniquenessType, filterable, sortable, nullable, defaultValue, localized, indexedDecimalPlaces, representative, sortableInScopes, filterableInScopes, uniqueGloballyInScopes, uniqueInScopes)
        this.globalUniquenessType = globalUniquenessType
        this.uniqueGloballyInScopes = uniqueGloballyInScopes
        this.uniqueInScopes = uniqueInScopes
    }

    get representativeFlags(): List<string> {
        if (this._representativeFlags == undefined) {
            const representativeFlags: string[] = []

            representativeFlags.push(this.formatDataTypeForFlag(this.type))

            const globalUniquenessType = this.globalUniquenessType
            const uniquenessType = this.uniquenessType
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
                this.filterable)
                representativeFlags.push(AttributeSchemaFlag.Filterable)

            if (this.sortable) representativeFlags.push(AttributeSchemaFlag.Sortable)
            if (this.localized) representativeFlags.push(AttributeSchemaFlag.Localized)
            if (this.nullable) representativeFlags.push(AttributeSchemaFlag.Nullable)

            this._representativeFlags = List(representativeFlags)
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
