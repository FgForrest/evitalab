<script setup lang="ts">
/**
 * Committed catalog versions, newest first — the coordinates only.
 *
 * What actually changed in a version is rendered by `history-viewer`, which the header links out to. The restore
 * itself is one server operation, requested from `RestoreCatalogVersionDialog` for the row the user picked and then
 * **followed here**: the row's button turns into its progress until the task ends, and the outcome is toasted.
 * Following stops when this table goes away — the task does not, and it stays visible in the task viewer.
 *
 * **The source API is a reverse cursor scan with no total count** — a write-ahead log scan cannot produce one
 * cheaply — so the table reports one item more than it has actually seen whenever a full page came back. That is
 * what lets Vuetify's own footer offer the next page: the count is a floor on what exists, never a promise, and it
 * grows as the reader walks backwards.
 */

import { computed, onUnmounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { asError } from '@/utils/error'
import { List as ImmutableList } from 'immutable'
import type { Toaster } from '@/modules/notification/service/Toaster'
import { useToaster } from '@/modules/notification/service/Toaster'
import { useWorkspaceService, WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import {
    MutationHistoryViewerTabFactory,
    useHistoryViewerTabFactory
} from '@/modules/history-viewer/service/MutationHistoryViewerTabFactory'
import RestoreCatalogVersionDialog from '@/modules/catalog-viewer/component/history/RestoreCatalogVersionDialog.vue'
import { CatalogVersionSummary } from '@/modules/catalog-viewer/model/CatalogVersionSummary'
import { TaskStatus } from '@/modules/database-driver/request-response/task/TaskStatus'
import { TaskState } from '@/modules/database-driver/request-response/task/TaskState'
import { CatalogViewerService, useCatalogViewerService } from '@/modules/catalog-viewer/service/CatalogViewerService'
import { formatBytes, formatDateTime, formatNumber } from '@/modules/catalog-viewer/service/statisticsFormatting'

const catalogViewerService: CatalogViewerService = useCatalogViewerService()
const mutationHistoryViewerTabFactory: MutationHistoryViewerTabFactory = useHistoryViewerTabFactory()
const workspaceService: WorkspaceService = useWorkspaceService()
const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<{
    catalogName: string
    /**
     * Oldest catalog version a query or restore can still reach; `undefined` when no history is retained. A version
     * below it is listed but is not reversible any more.
     */
    oldestAvailableVersion: bigint | undefined
    /**
     * Current catalog version. Only used to tell the two empty states apart — a catalog that has never committed
     * anything from one whose versions are simply not in the retained write-ahead log.
     */
    newestVersion: bigint | undefined
    reloadToken: number
}>()
const emit = defineEmits<{
    /**
     * A restore requested from this table has finished on the server — the catalog under the target name is now the
     * restored one, so the coordinates around this table are stale.
     */
    (e: 'restored'): void
}>()

/**
 * Interval in milliseconds between two reads of a followed restore task.
 */
const restoreTaskPollingInterval: number = 2000

const pageSizes: readonly number[] = [25, 50, 100]

const versions = ref<ImmutableList<CatalogVersionSummary>>(ImmutableList())
const loading = ref<boolean>(false)
/**
 * Page and page size are owned by the table below (Vuetify counts pages from one), so its footer drives the scan
 * instead of a second set of controls next to it.
 */
const page = ref<number>(1)
const pageSize = ref<number>(25)
/**
 * Upper bounds of the pages already visited, indexed by page number minus one, so the reverse-only scan can be
 * walked backwards as well as forwards.
 */
const anchors = ref<(number | undefined)[]>([undefined])

const showRestoreDialog = ref<boolean>(false)
const restoreVersion = ref<CatalogVersionSummary>()
/**
 * Progress in percent of the restore tasks still running, by the version they restore. A version with an entry
 * renders its progress instead of the button.
 */
const restoresInProgress = reactive<Map<number, number>>(new Map())
/**
 * Cancels every task follow-up when the table goes away.
 */
const followAbort: AbortController = new AbortController()
onUnmounted(() => followAbort.abort())

const items = computed<CatalogVersionSummary[]>(() => versions.value.toArray())

const headers = computed(() => [
    { title: t('catalogViewer.history.versions.column.version'), key: 'version', sortable: false },
    { title: t('catalogViewer.history.versions.column.timestamp'), key: 'timestamp', sortable: false },
    { title: t('catalogViewer.history.versions.column.mutations'), key: 'mutations', sortable: false },
    { title: t('catalogViewer.history.versions.column.walSize'), key: 'walSize', sortable: false },
    { title: t('catalogViewer.history.versions.column.reversible'), key: 'reversible', sortable: false },
    { title: '', key: 'actions', sortable: false, align: 'end' as const }
])

const headerDescriptions: Record<string, string> = {
    version: t('catalogViewer.history.versions.help.version'),
    timestamp: t('catalogViewer.history.versions.help.timestamp'),
    mutations: t('catalogViewer.history.versions.help.mutations'),
    walSize: t('catalogViewer.history.versions.help.walSize'),
    reversible: t('catalogViewer.history.versions.help.reversibleColumn')
}

/**
 * A full page means the scan can be continued; a short one is the end of the history. See the component comment
 * for why this is reported as an item count rather than as a "load more" affordance.
 */
const itemsLength = computed<number>(() =>
    (page.value - 1) * pageSize.value + versions.value.size + (versions.value.size === pageSize.value ? 1 : 0)
)

async function load(): Promise<void> {
    loading.value = true
    try {
        versions.value = await catalogViewerService.getCatalogVersions(
            props.catalogName,
            anchors.value[page.value - 1],
            pageSize.value
        )
    } catch (e) {
        await toaster.error(t('catalogViewer.history.versions.notification.couldNotLoad'), asError(e))
    } finally {
        loading.value = false
    }
}

function resetPaging(): void {
    anchors.value = [undefined]
    page.value = 1
}

/**
 * Turning a page forward has to record where the next one starts *before* the rows are replaced, because the anchor
 * is the oldest version currently on screen. Only the page after the last visited one can be reached, which is
 * exactly what the item count above offers.
 */
watch([page, pageSize], async ([newPage, newPageSize], [oldPage, oldPageSize]) => {
    if (newPageSize !== oldPageSize) {
        anchors.value = [undefined]
        if (newPage !== 1) {
            page.value = 1
            return
        }
    } else if (newPage > oldPage) {
        const oldest: CatalogVersionSummary | undefined = versions.value.last()
        if (oldest == undefined) {
            return
        }
        // the scan bound is inclusive, so the next page starts one version below the oldest one shown
        anchors.value = [...anchors.value.slice(0, oldPage), oldest.version - 1]
    }
    await load()
})

watch(
    [() => props.catalogName, () => props.reloadToken],
    async () => {
        resetPaging()
        await load()
    },
    { immediate: true }
)

function reversible(version: CatalogVersionSummary): boolean {
    return props.oldestAvailableVersion != undefined && BigInt(version.version) >= props.oldestAvailableVersion
}

function openMutationHistory(): void {
    workspaceService.createTab(mutationHistoryViewerTabFactory.createNew(props.catalogName))
}

function openRestore(version: CatalogVersionSummary): void {
    restoreVersion.value = version
    showRestoreDialog.value = true
}

/**
 * Follows the accepted restore task until it ends, rendering its progress on the row that requested it. The
 * server-side task is the one place the outcome exists, so both the success and the failure are reported from here.
 */
async function followRestore(version: CatalogVersionSummary, task: TaskStatus): Promise<void> {
    restoresInProgress.set(version.version, task.progress)
    let lastStatus: TaskStatus = task
    try {
        for await (const status of catalogViewerService.followTask(
            task.taskId,
            restoreTaskPollingInterval,
            followAbort.signal
        )) {
            lastStatus = status
            restoresInProgress.set(version.version, status.progress)
        }
    } catch (e) {
        restoresInProgress.delete(version.version)
        await toaster.error(
            t(
                'catalogViewer.history.versions.restore.notification.couldNotFollowRestore',
                { catalogName: props.catalogName, version: formatNumber(version.version) }
            ),
            asError(e)
        )
        return
    }
    restoresInProgress.delete(version.version)
    if (followAbort.signal.aborted) {
        return
    }
    switch (lastStatus.state) {
        case TaskState.Finished:
            await toaster.success(t(
                'catalogViewer.history.versions.restore.notification.restored',
                { catalogName: props.catalogName, version: formatNumber(version.version) }
            ))
            emit('restored')
            await load()
            break
        case TaskState.Failed:
            await toaster.error(t(
                'catalogViewer.history.versions.restore.notification.restoreFailed',
                {
                    catalogName: props.catalogName,
                    version: formatNumber(version.version),
                    reason: lastStatus.exception
                        ?? t('catalogViewer.history.versions.restore.notification.unknownFailureReason')
                }
            ))
            break
    }
}
</script>

<template>
    <div class="catalog-versions">
        <div class="catalog-versions__header">
            <h3 class="catalog-versions__title">{{ t('catalogViewer.history.versions.title') }}</h3>
            <VBtn
                size="small"
                append-icon="mdi-open-in-new"
                @click="openMutationHistory"
            >
                {{ t('catalogViewer.history.versions.openMutationHistory') }}
            </VBtn>
        </div>

        <VDataTableServer
            v-model:page="page"
            v-model:items-per-page="pageSize"
            :headers="headers"
            :items="items"
            :items-length="itemsLength"
            :items-per-page-options="[...pageSizes]"
            :loading="loading"
            item-value="version"
            density="compact"
        >
            <!-- the same explained header the other tables of the preview carry; nothing here is sortable,
                 because the source API scans the write-ahead log backwards and offers no other order -->
            <template
                v-for="header in headers"
                :key="header.key"
                v-slot:[`header.${header.key}`]="{ column }"
            >
                <span v-if="headerDescriptions[header.key] != undefined" class="catalog-versions__header-title">
                    {{ column.title }}
                    <VIcon icon="mdi-information-outline" size="x-small" />
                    <VTooltip activator="parent">
                        {{ headerDescriptions[header.key] }}
                    </VTooltip>
                </span>
            </template>

            <template v-slot:[`item.version`]="{ item }">
                {{ formatNumber(item.version) }}
            </template>
            <template v-slot:[`item.timestamp`]="{ item }">
                {{ formatDateTime(item.commitTimestamp) }}
            </template>
            <template v-slot:[`item.mutations`]="{ item }">
                {{ formatNumber(item.mutationCount) }}
            </template>
            <template v-slot:[`item.walSize`]="{ item }">
                {{ formatBytes(item.walSizeInBytes) }}
            </template>
            <template v-slot:[`item.reversible`]="{ item }">
                <VIcon :color="reversible(item) ? 'success' : undefined" size="small">
                    {{ reversible(item) ? 'mdi-check' : 'mdi-close' }}
                </VIcon>
                <VTooltip activator="parent">
                    {{
                        reversible(item)
                            ? t('catalogViewer.history.versions.help.reversible')
                            : t('catalogViewer.history.versions.help.notReversible')
                    }}
                </VTooltip>
            </template>
            <template v-slot:[`item.actions`]="{ item }">
                <!-- a running restore takes the button's place, so the row cannot be restored twice at once and the
                     progress reads where the action was; the percentage is the server task's own figure -->
                <span
                    v-if="restoresInProgress.has(item.version)"
                    class="catalog-versions__restore-progress"
                >
                    <VProgressCircular
                        :model-value="restoresInProgress.get(item.version)"
                        :indeterminate="restoresInProgress.get(item.version) === 0"
                        size="16"
                        width="2"
                    />
                    {{
                        t('catalogViewer.history.versions.button.restoring', {
                            progress: restoresInProgress.get(item.version)
                        })
                    }}
                    <VTooltip activator="parent">
                        {{ t('catalogViewer.history.versions.help.restoring') }}
                    </VTooltip>
                </span>
                <VBtn
                    v-else
                    size="small"
                    prepend-icon="mdi-backup-restore"
                    :disabled="!reversible(item)"
                    @click="openRestore(item)"
                >
                    {{ t('catalogViewer.history.versions.button.restore') }}
                </VBtn>
            </template>

            <!-- an empty table is two different findings, and only one of them is normal -->
            <template #no-data>
                <span class="text-disabled font-italic">
                    {{
                        newestVersion == undefined || newestVersion === 0n
                            ? t('catalogViewer.history.versions.placeholder.noneCommitted')
                            : t('catalogViewer.history.versions.placeholder.noneRetained', {
                                version: formatNumber(newestVersion)
                            })
                    }}
                </span>
            </template>
        </VDataTableServer>

        <RestoreCatalogVersionDialog
            v-if="showRestoreDialog && restoreVersion != undefined"
            v-model="showRestoreDialog"
            :catalog-name="catalogName"
            :version="restoreVersion"
            @restore="followRestore(restoreVersion, $event)"
        />
    </div>
</template>

<style lang="scss" scoped>
.catalog-versions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    &__header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    &__title {
        font-size: 1rem;
        font-weight: 500;
    }

    &__header-title {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
    }

    &__restore-progress {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.75rem;
        white-space: nowrap;
    }
}
</style>
