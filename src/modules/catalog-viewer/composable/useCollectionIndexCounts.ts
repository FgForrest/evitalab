import type { Ref } from 'vue'
import { computed } from 'vue'
import { List as ImmutableList } from 'immutable'
import { CollectionInfo } from '@/modules/database-driver/request-response/statistics/CollectionInfo'
import { catalogViewerComponents } from '@/modules/catalog-viewer/service/CatalogViewerService'
import { useCollectionSnapshots } from '@/modules/catalog-viewer/composable/useCollectionSnapshots'

/**
 * Reads the index count of every entity collection of a catalog, so a collection selector can say where the indexes
 * are before one is picked.
 *
 * The catalog level reports only the catalog-wide total by design, so the breakdown costs one call per collection —
 * the shared {@link useCollectionSnapshots} fan-out with `INDEX_SUMMARY` alone, which the server answers from
 * maintained per-(type, scope) counters; the cardinality walk is never requested here.
 *
 * A collection whose count has not answered has no entry at all: the chip then renders no badge, which is not the
 * same claim as zero.
 *
 * @param catalogName catalog the collections belong to
 * @param collections collection inventory, as the catalog-level snapshot reports it
 * @param reloadToken bumped by the tab's reload action
 * @param notificationKey i18n key of the failure toast; the first failure is passed to the toaster alongside it
 */
export function useCollectionIndexCounts(
    catalogName: () => string,
    collections: () => ImmutableList<CollectionInfo> | undefined,
    reloadToken: () => number,
    notificationKey: string
): Ref<ReadonlyMap<string, number>> {
    const { snapshots } = useCollectionSnapshots(
        catalogName,
        collections,
        catalogViewerComponents.indexesCollectionSummary,
        reloadToken,
        notificationKey
    )

    return computed<ReadonlyMap<string, number>>(() => {
        const counts: Map<string, number> = new Map()
        for (const [entityType, snapshot] of snapshots.value) {
            const totalIndexCount: number | undefined = snapshot.indexSummary?.totalIndexCount
            if (totalIndexCount != undefined) {
                counts.set(entityType, totalIndexCount)
            }
        }
        return counts
    })
}
