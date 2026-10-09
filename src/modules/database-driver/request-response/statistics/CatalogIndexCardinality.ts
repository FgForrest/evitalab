import { List as ImmutableList } from 'immutable'
import {
    GlobalUniqueIndexCardinality
} from '@/modules/database-driver/request-response/statistics/GlobalUniqueIndexCardinality'

/**
 * How many distinct values each of the catalog's global unique indexes holds. Unlike its collection-level
 * counterpart this is cheap - the number of such indexes is bounded by the schema, and every reading is an
 * incrementally maintained counter.
 */
export class CatalogIndexCardinality {

    readonly globalUniqueIndexes: ImmutableList<GlobalUniqueIndexCardinality>

    constructor(globalUniqueIndexes: ImmutableList<GlobalUniqueIndexCardinality>) {
        this.globalUniqueIndexes = globalUniqueIndexes
    }
}
