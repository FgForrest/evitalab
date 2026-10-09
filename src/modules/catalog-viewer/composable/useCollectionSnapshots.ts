import type { Ref } from 'vue'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { asError } from '@/utils/error'
import { List as ImmutableList } from 'immutable'
import type { Toaster } from '@/modules/notification/service/Toaster'
import { useToaster } from '@/modules/notification/service/Toaster'
import { CollectionInfo } from '@/modules/database-driver/request-response/statistics/CollectionInfo'
import {
    CatalogStatisticsComponent
} from '@/modules/database-driver/request-response/statistics/CatalogStatisticsComponent'
import {
    EntityCollectionStatisticsSnapshot
} from '@/modules/database-driver/request-response/statistics/EntityCollectionStatisticsSnapshot'
import { CatalogViewerService, useCatalogViewerService } from '@/modules/catalog-viewer/service/CatalogViewerService'

/**
 * What a consumer gets back from {@link useCollectionSnapshots}.
 */
export interface CollectionSnapshotsState {
    /**
     * One snapshot per collection, keyed by entity type, in the inventory's order. A collection whose read failed
     * has no entry (or keeps its previous one), which is not the same claim as empty statistics.
     */
    readonly snapshots: Ref<ReadonlyMap<string, EntityCollectionStatisticsSnapshot>>
    readonly loading: Ref<boolean>
}

/**
 * Reads one collection-level statistics snapshot per collection of a catalog — the fan-out every per-collection
 * table and badge set of the catalog viewer is built on.
 *
 * The rules shared by all consumers:
 *
 * - **the inventory is watched by identity.** The catalog-level snapshot hands over a fresh list on every read, so
 *   watching the list itself would re-issue the per-collection calls on every poll tick — which per-row calls that
 *   may bear IO must never do;
 * - **the reads are independent.** One failed collection (dropped between the inventory read and the per-row call,
 *   say) costs its own entry only: the successes are kept, the failed collection keeps its previous reading if it
 *   has one, and the failure is reported once for the whole set;
 * - **the map is swapped over whole.** Entries are never emptied first, so a table built on it does not blink on a
 *   reload and is never half-populated.
 *
 * @param catalogName     catalog the collections belong to
 * @param collections     collection inventory, as the catalog-level snapshot reports it
 * @param components      statistics components each collection-level call requests
 * @param reloadToken     bumped by the tab's reload action
 * @param notificationKey i18n key of the failure toast; the first failure is passed to the toaster alongside it
 */
export function useCollectionSnapshots(
    catalogName: () => string,
    collections: () => ImmutableList<CollectionInfo> | undefined,
    components: readonly CatalogStatisticsComponent[],
    reloadToken: () => number,
    notificationKey: string
): CollectionSnapshotsState {
    const catalogViewerService: CatalogViewerService = useCatalogViewerService()
    const toaster: Toaster = useToaster()
    const { t } = useI18n()

    const snapshots = ref<ReadonlyMap<string, EntityCollectionStatisticsSnapshot>>(new Map())
    const loading = ref<boolean>(false)

    /**
     * Identity of the inventory — see the composable comment for why the list itself is not watched.
     */
    const identity = computed<string | undefined>(() =>
        collections()?.map((it: CollectionInfo) => it.entityType).join('\n')
    )

    async function load(): Promise<void> {
        const inventory: ImmutableList<CollectionInfo> | undefined = collections()
        if (inventory == undefined) {
            snapshots.value = new Map()
            return
        }
        loading.value = true
        try {
            const inventoryArray: CollectionInfo[] = inventory.toArray()
            const settled: PromiseSettledResult<EntityCollectionStatisticsSnapshot>[] = await Promise.allSettled(
                inventoryArray.map(async (collection: CollectionInfo) =>
                    await catalogViewerService.getCollectionSnapshot(
                        catalogName(),
                        collection.entityType,
                        components
                    ))
            )
            const next: Map<string, EntityCollectionStatisticsSnapshot> = new Map()
            let firstFailure: unknown = undefined
            settled.forEach((result: PromiseSettledResult<EntityCollectionStatisticsSnapshot>, i: number) => {
                // allSettled preserves arity, so the collection at the same index is always there
                const collection: CollectionInfo | undefined = inventoryArray[i]
                if (collection == undefined) {
                    return
                }
                if (result.status === 'fulfilled') {
                    next.set(collection.entityType, result.value)
                } else {
                    firstFailure = firstFailure ?? result.reason
                    const previous: EntityCollectionStatisticsSnapshot | undefined =
                        snapshots.value.get(collection.entityType)
                    if (previous != undefined) {
                        next.set(collection.entityType, previous)
                    }
                }
            })
            snapshots.value = next
            if (firstFailure != undefined) {
                // one message for the whole set - per-collection toasts of one transient outage would stack up
                await toaster.error(t(notificationKey), asError(firstFailure))
            }
        } finally {
            loading.value = false
        }
    }

    watch([identity, reloadToken], async () => await load(), { immediate: true })

    return { snapshots, loading }
}
