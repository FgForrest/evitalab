import { List as ImmutableList } from 'immutable'
import { BrowsedIndex } from '@/modules/database-driver/request-response/statistics/BrowsedIndex'
import { PaginatedList } from '@/modules/database-driver/request-response/PaginatedList'

/**
 * One page of an index browse, together with the catalog version it was read at.
 *
 * The version matters across pages: the index set moves as data is written, and two pages read at different
 * versions do not describe one set. It does not discriminate on a warming-up catalog, which runs no transactions
 * and therefore does not advance its version while the index set churns.
 */
export class BrowsedIndexPage extends PaginatedList<BrowsedIndex> {

    readonly catalogVersion: bigint

    constructor(
        data: ImmutableList<BrowsedIndex>,
        pageNumber: number,
        pageSize: number,
        totalNumberOfRecords: number,
        catalogVersion: bigint
    ) {
        super(data, pageNumber, pageSize, totalNumberOfRecords)
        this.catalogVersion = catalogVersion
    }
}
