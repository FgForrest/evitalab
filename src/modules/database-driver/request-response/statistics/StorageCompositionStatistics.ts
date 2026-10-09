import { List as ImmutableList } from 'immutable'
import { StoragePartUsage } from '@/modules/database-driver/request-response/statistics/StoragePartUsage'

/**
 * Where the bytes of the catalog's own data store (schemas, catalog-level indexes) go, per storage-part type. There
 * is deliberately no cross-collection sum - one collection's histogram is fetched by naming it.
 */
export class StorageCompositionStatistics {

    readonly catalogParts: ImmutableList<StoragePartUsage>

    constructor(catalogParts: ImmutableList<StoragePartUsage>) {
        this.catalogParts = catalogParts
    }
}
