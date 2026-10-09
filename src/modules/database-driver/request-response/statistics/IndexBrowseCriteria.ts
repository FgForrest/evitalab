import { List as ImmutableList } from 'immutable'
import { EntityIndexType } from '@/modules/database-driver/request-response/statistics/EntityIndexType'
import { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope'
import { IndexBrowseOrdering } from '@/modules/database-driver/request-response/statistics/IndexBrowseOrdering'
import { OrderDirection } from '@/modules/database-driver/request-response/schema/OrderDirection'

/**
 * One page request of an index browse.
 *
 * Filters are conjunctive across categories and disjunctive within one: an index must match every non-empty
 * category, and matches a category by being any one of its values. An empty list means the category does not filter.
 */
export class IndexBrowseCriteria {

    readonly catalogName: string
    /**
     * Entity collection whose indexes to browse. `undefined` browses the indexes the catalog holds itself.
     */
    readonly entityType: string | undefined
    /**
     * 1-indexed page number. Every ordering except {@link IndexBrowseOrdering.MapOrder} additionally requires
     * `pageNumber * pageSize <= 10000` and rejects anything beyond it.
     */
    readonly pageNumber: number
    /**
     * Between 1 and 1000; a larger value is rejected rather than clamped.
     */
    readonly pageSize: number
    readonly ordering: IndexBrowseOrdering
    /**
     * {@link IndexBrowseOrdering.MapOrder} ranks nothing and is accepted with ascending direction only.
     */
    readonly direction: OrderDirection
    readonly indexTypes: ImmutableList<EntityIndexType>
    readonly scopes: ImmutableList<EntityScope>
    readonly referenceNames: ImmutableList<string>

    constructor(
        catalogName: string,
        entityType: string | undefined,
        pageNumber: number,
        pageSize: number,
        ordering: IndexBrowseOrdering = IndexBrowseOrdering.MapOrder,
        direction: OrderDirection = OrderDirection.Asc,
        indexTypes: ImmutableList<EntityIndexType> = ImmutableList(),
        scopes: ImmutableList<EntityScope> = ImmutableList(),
        referenceNames: ImmutableList<string> = ImmutableList()
    ) {
        this.catalogName = catalogName
        this.entityType = entityType
        this.pageNumber = pageNumber
        this.pageSize = pageSize
        this.ordering = ordering
        this.direction = direction
        this.indexTypes = indexTypes
        this.scopes = scopes
        this.referenceNames = referenceNames
    }
}
