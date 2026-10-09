import type { Ref } from 'vue'
import { onScopeDispose, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { asError } from '@/utils/error'
import type { Toaster } from '@/modules/notification/service/Toaster'
import { useToaster } from '@/modules/notification/service/Toaster'
import {
    CatalogStatisticsComponent
} from '@/modules/database-driver/request-response/statistics/CatalogStatisticsComponent'
import {
    CatalogStatisticsSnapshot
} from '@/modules/database-driver/request-response/statistics/CatalogStatisticsSnapshot'
import { CatalogViewerService, useCatalogViewerService } from '@/modules/catalog-viewer/service/CatalogViewerService'

/**
 * Options of {@link useCatalogSnapshot}.
 */
export interface CatalogSnapshotOptions {
    /**
     * When set, the snapshot is re-read on this interval **while the page is displayed**. Only the cheap component
     * sets may pass it — a polled expensive component is exactly what the component-selected API exists to prevent.
     */
    readonly pollIntervalMillis?: number
    /**
     * i18n key of the failure toast; the caught error is passed to the toaster alongside it.
     */
    readonly notificationKey: string
}

/**
 * What a page gets back from {@link useCatalogSnapshot}.
 */
export interface CatalogSnapshotState {
    readonly snapshot: Ref<CatalogStatisticsSnapshot | undefined>
    readonly loading: Ref<boolean>
    /**
     * Whether polling is suspended. Only meaningful when an interval was configured; a page that offers a pause
     * button binds it to this.
     */
    readonly paused: Ref<boolean>
    /**
     * Re-reads the snapshot now. A user-requested read — the first load included — reports its failure; a background
     * poll stays silent, so a server that goes away for a minute does not produce a toast per tick.
     */
    reload(manual?: boolean): Promise<void>
}

/**
 * Reads one catalog-level statistics snapshot for a page of the catalog viewer, and keeps it current according to
 * that page's refresh policy.
 *
 * Two rules the pages rely on:
 *
 * - **nothing is requested while the page is not displayed.** Loading is triggered by the page becoming active, and
 *   the poll loop is cleared the moment it stops being;
 * - **a failed read keeps the previous reading on screen.** Blanking the page on a transient failure would throw
 *   away the last thing the user could act on.
 */
export function useCatalogSnapshot(
    catalogName: () => string,
    components: readonly CatalogStatisticsComponent[],
    active: () => boolean,
    reloadToken: () => number,
    options: CatalogSnapshotOptions
): CatalogSnapshotState {
    const catalogViewerService: CatalogViewerService = useCatalogViewerService()
    const toaster: Toaster = useToaster()
    const { t } = useI18n()

    const snapshot = ref<CatalogStatisticsSnapshot | undefined>()
    const loading = ref<boolean>(false)
    const paused = ref<boolean>(false)

    let timeoutId: ReturnType<typeof setTimeout> | undefined = undefined
    /**
     * Reload token the current snapshot was read at. A reload requested while the page was hidden must still be
     * honoured the next time it is shown, which comparing against the *previous watcher value* would miss.
     */
    let loadedToken: number | undefined = undefined
    /**
     * Sequence number of the newest reload requested. A manual reload can race an in-flight poll tick, and without
     * sequencing the poll's older reading could resolve last and overwrite the newer one — only the newest request
     * may touch the state.
     */
    let requestSequence: number = 0

    function clearPoll(): void {
        if (timeoutId != undefined) {
            clearTimeout(timeoutId)
            timeoutId = undefined
        }
    }

    function schedulePoll(): void {
        clearPoll()
        const interval: number | undefined = options.pollIntervalMillis
        if (interval == undefined || paused.value || !active()) {
            return
        }
        timeoutId = setTimeout(() => void reload(), interval)
    }

    async function reload(manual: boolean = false): Promise<void> {
        const request: number = ++requestSequence
        loading.value = true
        const token: number = reloadToken()
        try {
            const read: CatalogStatisticsSnapshot =
                await catalogViewerService.getCatalogSnapshot(catalogName(), components)
            if (request === requestSequence) {
                snapshot.value = read
                loadedToken = token
            }
        } catch (e) {
            if (manual && request === requestSequence) {
                await toaster.error(t(options.notificationKey), asError(e))
            }
        } finally {
            // an outdated request leaves the state to the newer one, its own finally runs this
            if (request === requestSequence) {
                loading.value = false
                // keep polling either way, so the page recovers on its own once the server is back
                schedulePoll()
            }
        }
    }

    watch(
        [active, reloadToken],
        async ([isActive]) => {
            if (!isActive) {
                clearPoll()
                return
            }
            const stale: boolean = loadedToken !== reloadToken()
            if (snapshot.value == undefined || stale) {
                // both are user-initiated (opening the page, pressing reload), so a failure is reported — a page
                // without a poll interval would otherwise stay blank with no explanation and no recovery
                await reload(true)
            } else {
                schedulePoll()
            }
        },
        { immediate: true }
    )

    watch(paused, () => schedulePoll())

    onScopeDispose(() => clearPoll())

    return { snapshot, loading, paused, reload }
}
