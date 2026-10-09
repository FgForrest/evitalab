import { List as ImmutableList } from 'immutable'
import { IndexTypeCount } from '@/modules/database-driver/request-response/statistics/IndexTypeCount'

/**
 * How many indexes one collection holds, broken down by type and scope. Pairs with no index are omitted rather than
 * reported as zero.
 */
export class CollectionIndexSummary {

    readonly totalIndexCount: number
    readonly byTypeAndScope: ImmutableList<IndexTypeCount>

    constructor(totalIndexCount: number, byTypeAndScope: ImmutableList<IndexTypeCount>) {
        this.totalIndexCount = totalIndexCount
        this.byTypeAndScope = byTypeAndScope
    }
}
