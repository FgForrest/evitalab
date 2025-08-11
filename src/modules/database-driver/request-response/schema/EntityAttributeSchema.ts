import { List as ImmutableList, Map as ImmutableMap } from 'immutable'
import { NamingConvention } from '../NamingConvetion'
import { AttributeSchema, AttributeSchemaFlag } from '@/modules/database-driver/request-response/schema/AttributeSchema'
import { Scalar } from '@/modules/database-driver/data-type/Scalar'
import { EntityScope, EntityScopeIcons } from '@/modules/database-driver/request-response/schema/EntityScope.ts'
import type {
    ScopedAttributeUniquenessType
} from '@/modules/database-driver/request-response/schema/ScopedAttributeUniquenessType.ts'
import { Flag } from '@/modules/schema-viewer/viewer/model/Flag.ts'
import { AttributeUniquenessType } from '@/modules/database-driver/request-response/schema/AttributeUniquenessType.ts'
import { useI18n } from 'vue-i18n'
import { getEnumKeyByValue } from '@/utils/enum.ts'

/**
 * evitaLab's representation of a single evitaDB entity attribute schema independent of specific evitaDB version
 */
export class EntityAttributeSchema extends AttributeSchema {

    /**
     * Whether this attribute can be used to represent an entire entity.
     */
    readonly representative: boolean

    constructor(name: string,
                nameVariants: ImmutableMap<NamingConvention, string>,
                description: string | undefined,
                deprecationNotice: string | undefined,
                type: Scalar,
                nullable: boolean,
                defaultValue: any | any[] | undefined,
                localized: boolean,
                indexedDecimalPlaces: number,
                representative: boolean,
                sortableInScopes: ImmutableList<EntityScope>,
                filteredInScopes: ImmutableList<EntityScope>,
                uniqueInScopes: ImmutableList<ScopedAttributeUniquenessType>
    ) {
        super(name, nameVariants, description, deprecationNotice, type, nullable, defaultValue, localized, indexedDecimalPlaces, sortableInScopes, filteredInScopes, uniqueInScopes)
        this.representative = representative
    }

    get representativeFlags(): ImmutableList<Flag> {
        if (this._representativeFlags == undefined) {
            const representativeFlags: Flag[] = []
            const { t } = useI18n()

            representativeFlags.push(new Flag(this.formatDataTypeForFlag(this.type)))

            if (this.representative) {
                representativeFlags.push(new Flag(EntityAttributeSchemaFlag.Representative))
            }

            for (const uniqueness of this.uniqueInScopes) {
                if (uniqueness.uniquenessType === AttributeUniquenessType.UniqueWithinCollection)
                    representativeFlags.push(new Flag(AttributeSchemaFlag.Unique, this.uniqueInScopes.map(x => x.scope).toArray()))
                else if (uniqueness.uniquenessType === AttributeUniquenessType.UniqueWithinCollectionLocale)
                    representativeFlags.push(new Flag(AttributeSchemaFlag.UniquePerLocale, this.uniqueInScopes.map(x => x.scope).toArray()))
            }

            if (this.sortableInScopes.size > 0) {
                representativeFlags.push(new Flag(AttributeSchemaFlag.Sortable, this.sortableInScopes.map(x => EntityScopeIcons[x]).toArray(), t('schemaViewer.attribute.tooltip.content', [t('schemaViewer.tooltip.sorted'), this.sortableInScopes.map(z => t(`schemaViewer.tooltip.${getEnumKeyByValue(EntityScope, z).toLowerCase()}`)).join('/')])))
            }
            if (this.localized) {
                representativeFlags.push(new Flag(AttributeSchemaFlag.Localized))
            }
            if (this.nullable) {
                representativeFlags.push(new Flag(AttributeSchemaFlag.Nullable))
            }

            this._representativeFlags = ImmutableList(representativeFlags)
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
