import Immutable, { List, Map } from 'immutable'
import { NamingConvention } from '../NamingConvetion'
import { AttributeSchema, AttributeSchemaFlag } from '@/modules/database-driver/request-response/schema/AttributeSchema'
import { Scalar } from '@/modules/database-driver/data-type/Scalar'
import { AttributeUniquenessType } from '@/modules/database-driver/request-response/schema/AttributeUniquenessType'

/**
 * evitaLab's representation of a single evitaDB entity attribute schema independent of specific evitaDB version
 */
export class EntityAttributeSchema extends AttributeSchema {

    /**
     * Whether this attribute can be used to represent an entire entity.
     */
    readonly representative: boolean

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
                indexedDecimalPlaces: number,
                representative: boolean) {
        super(name, nameVariants, description, deprecationNotice, type, uniquenessType, filterable, sortable, nullable, defaultValue, localized, indexedDecimalPlaces)
        this.representative = representative
    }

    get representativeFlags(): Immutable.List<string> {
        if (this._representativeFlags == undefined) {
            const representativeFlags: string[] = []

            representativeFlags.push(this.formatDataTypeForFlag(this.type))

            if (this.representative) representativeFlags.push(EntityAttributeSchemaFlag.Representative)

            if (this.uniquenessType === AttributeUniquenessType.UniqueWithinCollection) {
                representativeFlags.push(AttributeSchemaFlag.Unique)
            } else if (this.uniquenessType === AttributeUniquenessType.UniqueWithinCollectionLocale) {
                representativeFlags.push(AttributeSchemaFlag.UniquePerLocale)
            }

            if (this.uniquenessType != AttributeUniquenessType.NotUnique || this.filterable)
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
 * Specific supported representative flags for entity attribute schema
 */
export enum EntityAttributeSchemaFlag {
    Representative = '_attributeSchema.representative'
}
