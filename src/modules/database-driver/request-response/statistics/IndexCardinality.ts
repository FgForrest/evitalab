import { List as ImmutableList } from 'immutable'
import { EntityIndexType } from '@/modules/database-driver/request-response/statistics/EntityIndexType'
import { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope'
import { AttributeCardinality } from '@/modules/database-driver/request-response/statistics/AttributeCardinality'

/**
 * The cardinality readings of one index.
 */
export class IndexCardinality {

    /**
     * Unset when the index is one the catalog holds itself - those are addressed by scope alone.
     */
    readonly indexType: EntityIndexType | undefined
    readonly scope: EntityScope
    /**
     * What distinguishes this index from its siblings of the same type. Unset for the global index. Opaque - display
     * it, do not parse it.
     */
    readonly discriminator: string | undefined
    /**
     * How many entities this index covers. Unset for an index the catalog holds itself, which maintains no
     * primary-key bitmap - `0` would read as "covers nothing", which is a different statement.
     */
    readonly entityCount: number | undefined
    /**
     * How many distinct referenced entities this index tracks. Unset for an index that tracks none.
     */
    readonly referencedEntityCount: number | undefined
    readonly attributes: ImmutableList<AttributeCardinality>

    constructor(
        indexType: EntityIndexType | undefined,
        scope: EntityScope,
        discriminator: string | undefined,
        entityCount: number | undefined,
        referencedEntityCount: number | undefined,
        attributes: ImmutableList<AttributeCardinality>
    ) {
        this.indexType = indexType
        this.scope = scope
        this.discriminator = discriminator
        this.entityCount = entityCount
        this.referencedEntityCount = referencedEntityCount
        this.attributes = attributes
    }
}
