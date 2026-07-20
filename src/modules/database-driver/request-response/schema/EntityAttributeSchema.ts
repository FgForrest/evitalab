import type { EvitaValue } from '@/modules/database-driver/data-type/EvitaValue'
import { List as ImmutableList, Map as ImmutableMap } from 'immutable'
import { NamingConvention } from '../NamingConvetion'
import { AttributeSchema } from '@/modules/database-driver/request-response/schema/AttributeSchema'
import { Scalar } from '@/modules/database-driver/data-type/Scalar'
import { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope.ts'
import type {
    ScopedAttributeUniquenessType
} from '@/modules/database-driver/request-response/schema/ScopedAttributeUniquenessType.ts'
import { Flag } from '@/modules/schema-viewer/viewer/model/Flag.ts'

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
                defaultValue: EvitaValue | EvitaValue[] | undefined,
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

    protected override prefixFlags(): Flag[] {
        const flags: Flag[] = []
        if (this.representative) {
            flags.push(new Flag(EntityAttributeSchemaFlag.Representative))
        }
        return flags
    }
}

/**
 * Specific supported representative flags for entity attribute schema
 */
export enum EntityAttributeSchemaFlag {
    Representative = '_attributeSchema.representative'
}
