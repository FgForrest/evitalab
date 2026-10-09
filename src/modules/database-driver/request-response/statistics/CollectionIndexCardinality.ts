import { List as ImmutableList } from 'immutable'
import { IndexCardinality } from '@/modules/database-driver/request-response/statistics/IndexCardinality'

/**
 * How many distinct values each of one collection's schema-bounded indexes holds, next to how many records those
 * values cover.
 *
 * Only the schema-bounded indexes are described. The per-referenced-entity indexes, of which there can be tens of
 * thousands, are counted into {@link omittedIndexCount} instead - describing them would make the response grow with
 * the catalog's data volume. Nothing is lost analytically: their selectivity is a property of the reference, which
 * the reference-type index above them already summarises.
 */
export class CollectionIndexCardinality {

    readonly indexes: ImmutableList<IndexCardinality>
    /**
     * How many of this collection's indexes were counted but not described. `0` means every index is present in
     * {@link indexes}.
     */
    readonly omittedIndexCount: number

    constructor(indexes: ImmutableList<IndexCardinality>, omittedIndexCount: number) {
        this.indexes = indexes
        this.omittedIndexCount = omittedIndexCount
    }
}
