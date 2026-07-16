import { List, Map } from 'immutable'
import { NamingConvention } from '../NamingConvetion'
import { EntityAttributeSchema } from '@/modules/database-driver/request-response/schema/EntityAttributeSchema'
import { Scalar } from '@/modules/database-driver/data-type/Scalar'
import { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope.ts'
import type {
    ScopedAttributeUniquenessType
} from '@/modules/database-driver/request-response/schema/ScopedAttributeUniquenessType.ts'
import type {
    ScopedGlobalAttributeUniquenessType
} from '@/modules/database-driver/request-response/schema/ScopedGlobalAttributeUniquenessType.ts'
import { Flag } from '@/modules/schema-viewer/viewer/model/Flag.ts'
import {
    GlobalAttributeUniquenessType
} from '@/modules/database-driver/request-response/schema/GlobalAttributeUniquenessType.ts'
import { i18n } from '@/vue-plugins/i18n.ts'
import { getEnumKeyByValue } from '@/utils/enum.ts'

/**
 * evitaLab's representation of a single evitaDB global attribute schema independent of specific evitaDB version
 */
export class GlobalAttributeSchema extends EntityAttributeSchema {

    /**
     * When attribute is unique globally it is automatically filterable, and it is ensured there is exactly one single          entity having certain value of this attribute in entire catalog.           As an example of unique attribute can be URL - there is no sense in having two entities with same URL, and it's          better to have this ensured by the database engine.
     */
    readonly uniqueGloballyInScopes: List<ScopedGlobalAttributeUniquenessType>

    constructor(name: string,
                nameVariants: Map<NamingConvention, string>,
                description: string | undefined,
                deprecationNotice: string | undefined,
                type: Scalar,
                nullable: boolean,
                defaultValue: any,
                localized: boolean,
                indexedDecimalPlaces: number,
                representative: boolean,
                sortableInScopes: List<EntityScope>,
                filterableInScopes: List<EntityScope>,
                uniqueGloballyInScopes: List<ScopedGlobalAttributeUniquenessType>,
                uniqueInScopes: List<ScopedAttributeUniquenessType>) {
        super(name, nameVariants, description, deprecationNotice, type, nullable, defaultValue, localized, indexedDecimalPlaces, representative, sortableInScopes, filterableInScopes, uniqueInScopes)
        this.uniqueGloballyInScopes = uniqueGloballyInScopes
    }

    protected uniquenessFlags(): Flag[] {
        const flags: Flag[] = []
        for (const flag of this.uniqueGloballyInScopes.groupBy(x => x.uniquenessType)) {
            if (flag[0] === GlobalAttributeUniquenessType.UniqueWithinCatalog) {
                flags.push(new Flag(GlobalAttributeSchemaFlag.GloballyUnique, flag[1].map(x => x.scope).toArray(), i18n.global.t('schemaViewer.attribute.tooltip.uniqueContent', [
                    i18n.global.t('schemaViewer.section.flag.attributeSchema.globallyUnique').toLowerCase(),
                    flag[1].map(z => i18n.global.t(`schemaViewer.tooltip.${getEnumKeyByValue(EntityScope, z.scope).toLowerCase()}`)).join('/')])))
            } else if (flag[0] === GlobalAttributeUniquenessType.UniqueWithinCatalogLocale) {
                flags.push(new Flag(GlobalAttributeSchemaFlag.GloballyUniquePerLocale, flag[1].map(x => x.scope).toArray(), i18n.global.t('schemaViewer.attribute.tooltip.uniqueContent', [
                    i18n.global.t('schemaViewer.section.flag.attributeSchema.globallyUniquePerLocale').toLowerCase(),
                    flag[1].map(z => i18n.global.t(`schemaViewer.tooltip.${getEnumKeyByValue(EntityScope, z.scope).toLowerCase()}`)).join('/')])))
            }
        }
        return [...flags, ...super.uniquenessFlags()]
    }

    protected isImplicitlyFilterable(): boolean {
        return super.isImplicitlyFilterable() || !this.uniqueGloballyInScopes.isEmpty()
    }
}

/**
 * Specific supported representative flags for global attribute schema
 */
export enum GlobalAttributeSchemaFlag {
    GloballyUnique = '_attributeSchema.globallyUnique',
    GloballyUniquePerLocale = '_attributeSchema.globallyUniquePerLocale',
}
