import { AttributeSchema, AttributeSchemaFlag } from '@/modules/connection/model/schema/AttributeSchema'
import Immutable, { List, Map } from 'immutable'
import { AttributeUniquenessType } from '@/modules/connection/model/schema/AttributeUniquenessType'
import { NamingConvention } from '../NamingConvetion'
import { Value } from '@/modules/connection/model/Value'
import { Scalar } from '@/modules/connection/model/data-type/Scalar'

/**
 * evitaLab's representation of a single evitaDB entity attribute schema independent of specific evitaDB version
 */
export class EntityAttributeSchema extends AttributeSchema {

    /**
     * Whether this attribute can be used to represent an entire entity.
     */
    readonly representative: Value<boolean>

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
                indexedDecimalPlaces: Value<number>,
                representative: Value<boolean>) {
        super(name, nameVariants, description, deprecationNotice, type, uniquenessType, filterable, sortable, nullable, defaultValue, localized, indexedDecimalPlaces)
        this.representative = representative
    }

    get representativeFlags(): Immutable.List<string> {
        if (this._representativeFlags == undefined) {
            const representativeFlags: string[] = []

            this.type.ifSupported(type =>
                representativeFlags.push(this.formatDataTypeForFlag(type)))

            if (this.representative.getOrElse(false)) representativeFlags.push(EntityAttributeSchemaFlag.Representative)

            this.uniquenessType.ifSupported(uniquenessType => {
                if (uniquenessType === AttributeUniquenessType.UniqueWithinCollection) {
                    representativeFlags.push(AttributeSchemaFlag.Unique)
                } else if (uniquenessType === AttributeUniquenessType.UniqueWithinCollectionLocale) {
                    representativeFlags.push(AttributeSchemaFlag.UniquePerLocale)
                }
            })

            if (this.uniquenessType.getOrElse(AttributeUniquenessType.NotUnique) != AttributeUniquenessType.NotUnique ||
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
 * Specific supported representative flags for entity attribute schema
 */
export enum EntityAttributeSchemaFlag {
    Representative = '_attributeSchema.representative'
}
