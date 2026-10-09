import { List as ImmutableList } from 'immutable'
import { StoragePartUsage } from '@/modules/database-driver/request-response/statistics/StoragePartUsage'

/**
 * Where one collection's bytes go, per storage-part type.
 */
export class CollectionStorageComposition {

    readonly parts: ImmutableList<StoragePartUsage>

    constructor(parts: ImmutableList<StoragePartUsage>) {
        this.parts = parts
    }
}
