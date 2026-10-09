<script setup lang="ts">
/**
 * Catalog preview tab — everything the engine can say about one catalog, split into six pages.
 *
 * The split is not cosmetic: each page maps onto a small set of engine *statistics components* that it requests on
 * its own, so a page never pays for a page the user has not opened. Overview and Activity are cheap and polled;
 * Storage and History cost targeted file stats; Indexes and Memory are the expensive ones and are never polled.
 */

import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { List as ImmutableList } from 'immutable'
import { asError } from '@/utils/error'
import VTabToolbar from '@/modules/base/component/VTabToolbar.vue'
import VMissingDataIndicator from '@/modules/base/component/VMissingDataIndicator.vue'
import VActionTooltip from '@/modules/base/component/VActionTooltip.vue'
import ShareTabButton from '@/modules/workspace/tab/component/ShareTabButton.vue'
import type { TabComponentEvents } from '@/modules/workspace/tab/model/TabComponentEvents'
import type { TabComponentProps } from '@/modules/workspace/tab/model/TabComponentProps'
import type { TabComponentExpose } from '@/modules/workspace/tab/model/TabComponentExpose'
import { TabType } from '@/modules/workspace/tab/model/TabType'
import { SubjectPath } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPath'
import {
    ConnectionSubjectPath
} from '@/modules/connection/workspace/status-bar/model/subject-path-status/ConnectionSubjectPath'
import { SubjectPathItem } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPathItem'
import { Command } from '@/modules/keymap/model/Command'
import { Keymap, useKeymap } from '@/modules/keymap/service/Keymap'
import type { Toaster } from '@/modules/notification/service/Toaster'
import { useToaster } from '@/modules/notification/service/Toaster'
import { CatalogStatistics } from '@/modules/database-driver/request-response/CatalogStatistics'
import { CatalogState } from '@/modules/database-driver/request-response/CatalogState'
import { CatalogViewerTabParams } from '@/modules/catalog-viewer/model/CatalogViewerTabParams'
import { CatalogViewerTabData } from '@/modules/catalog-viewer/model/CatalogViewerTabData'
import { CatalogViewerTabDefinition } from '@/modules/catalog-viewer/model/CatalogViewerTabDefinition'
import { CatalogViewerPage } from '@/modules/catalog-viewer/model/CatalogViewerPage'
import { CatalogViewerService, useCatalogViewerService } from '@/modules/catalog-viewer/service/CatalogViewerService'
import OverviewPage from '@/modules/catalog-viewer/component/overview/OverviewPage.vue'
import StoragePage from '@/modules/catalog-viewer/component/storage/StoragePage.vue'
import IndexesPage from '@/modules/catalog-viewer/component/indexes/IndexesPage.vue'
import MemoryPage from '@/modules/catalog-viewer/component/memory/MemoryPage.vue'
import ActivityPage from '@/modules/catalog-viewer/component/activity/ActivityPage.vue'
import HistoryPage from '@/modules/catalog-viewer/component/history/HistoryPage.vue'

const catalogViewerService: CatalogViewerService = useCatalogViewerService()
const keymap: Keymap = useKeymap()
const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<TabComponentProps<CatalogViewerTabParams, CatalogViewerTabData>>()
const emit = defineEmits<TabComponentEvents>()

const page = ref<CatalogViewerPage>(props.data.page)
const catalog = ref<CatalogStatistics>()
const reloadToken = ref<number>(0)
/**
 * Entity collection the page opened next should describe, when the page was opened from a collection row rather
 * than from the tab strip.
 */
const requestedEntityType = ref<string | undefined>()

const title: ImmutableList<string> = ImmutableList.of(
    props.params.catalogName,
    t('catalogViewer.title')
)

const currentData = computed<CatalogViewerTabData>(() => new CatalogViewerTabData(page.value))

const shareTabButtonRef = ref<InstanceType<typeof ShareTabButton> | undefined>()

/**
 * States the engine reports while a catalog is moving between two stable ones. Numbers read during them are not
 * final, so the page says so rather than presenting them as settled.
 */
const transitionalStates: ReadonlySet<CatalogState> = new Set([
    CatalogState.BeingCreated,
    CatalogState.BeingActivated,
    CatalogState.BeingDeactivated,
    CatalogState.BeingDeleted,
    CatalogState.BeingUpgraded,
    CatalogState.GoingAlive
])

const inTransition = computed<boolean>(() =>
    catalog.value != undefined && transitionalStates.has(catalog.value.catalogState)
)
const corrupted = computed<boolean>(() =>
    catalog.value != undefined && (catalog.value.unusable || catalog.value.catalogState === CatalogState.Corrupted)
)
const warmingUp = computed<boolean>(() => catalog.value?.catalogState === CatalogState.WarmingUp)

async function initialize(): Promise<void> {
    catalog.value = await catalogViewerService.getCatalogStatistics(props.params.catalogName)
}

/**
 * Reloads the catalog listing entry the header and the action dialogs read, and bumps the token every page watches
 * to refetch its own components. Errors surface as a toast — the pages stay on screen with their last reading.
 */
async function reload(): Promise<void> {
    try {
        catalog.value = await catalogViewerService.getCatalogStatistics(props.params.catalogName)
    } catch (e) {
        await toaster.error(
            t('catalogViewer.notification.couldNotLoadCatalog', { catalogName: props.params.catalogName }),
            asError(e)
        )
    }
    reloadToken.value++
}

function selectPage(newPage: CatalogViewerPage, entityType?: string): void {
    requestedEntityType.value = entityType
    page.value = newPage
    emit('update:data', currentData.value)
}

defineExpose<TabComponentExpose>({
    path(): SubjectPath | undefined {
        return new ConnectionSubjectPath(
            props.params.connection,
            [
                SubjectPathItem.plain(props.params.catalogName),
                SubjectPathItem.significant(
                    CatalogViewerTabDefinition.icon(),
                    t('catalogViewer.title')
                )
            ]
        )
    },
    async retry(): Promise<void> {
        await start()
    }
})

async function start(): Promise<void> {
    try {
        await initialize()
        emit('ready')
    } catch (e) {
        emit('error', asError(e) ?? new Error(String(e)))
    }
}

onMounted(() => {
    keymap.bind(Command.CatalogViewer_ShareTab, props.id, () => shareTabButtonRef.value?.share())
    keymap.bind(Command.CatalogViewer_Reload, props.id, async () => await reload())
    start()
})
onUnmounted(() => {
    keymap.unbind(Command.CatalogViewer_ShareTab, props.id)
    keymap.unbind(Command.CatalogViewer_Reload, props.id)
})
</script>

<template>
    <div class="catalog-viewer">
        <VTabToolbar :prepend-icon="CatalogViewerTabDefinition.icon()" :title="title">
            <template #append>
                <ShareTabButton
                    ref="shareTabButtonRef"
                    :tab-type="TabType.CatalogViewer"
                    :tab-params="params"
                    :tab-data="currentData"
                    :command="Command.CatalogViewer_ShareTab"
                />
                <VBtn icon @click="reload">
                    <VIcon>mdi-refresh</VIcon>
                    <VActionTooltip :command="Command.CatalogViewer_Reload">
                        {{ t('catalogViewer.button.reload') }}
                    </VActionTooltip>
                </VBtn>
            </template>
        </VTabToolbar>

        <VSheet class="catalog-viewer__body">
            <VAlert
                v-if="corrupted"
                type="error"
                density="compact"
                class="catalog-viewer__alert"
            >
                {{ t('catalogViewer.state.corrupted') }}
            </VAlert>
            <VAlert
                v-else-if="warmingUp"
                type="warning"
                density="compact"
                class="catalog-viewer__alert"
            >
                {{ t('catalogViewer.state.warmingUp') }}
            </VAlert>
            <template v-if="inTransition">
                <VAlert type="info" density="compact" class="catalog-viewer__alert">
                    {{ t('catalogViewer.state.inTransition') }}
                </VAlert>
                <VProgressLinear indeterminate color="primary-lightest" />
            </template>

            <VTabs
                :model-value="page"
                class="catalog-viewer__tabs"
                @update:model-value="value => selectPage(value as CatalogViewerPage)"
            >
                <VTab
                    v-for="pageType in CatalogViewerPage"
                    :key="pageType"
                    :value="pageType"
                >
                    {{ t(`catalogViewer.page.${pageType}`) }}
                </VTab>
            </VTabs>

            <!--
                Only the selected page is mounted. A `VWindow` would keep every page alive, and it cannot be used
                here anyway: the workspace tab list styles `.v-window` with an absolute-fill `:deep` rule, which a
                nested window inherits and which would lift this one out of the page flow.
            -->
            <div class="catalog-viewer__page">
                <OverviewPage
                    v-if="page === CatalogViewerPage.Overview"
                    :catalog-name="params.catalogName"
                    :catalog="catalog"
                    :active="true"
                    :reload-token="reloadToken"
                    @open-page="(nextPage, entityType) => selectPage(nextPage, entityType)"
                />
                <StoragePage
                    v-else-if="page === CatalogViewerPage.Storage"
                    :catalog-name="params.catalogName"
                    :active="true"
                    :reload-token="reloadToken"
                />
                <IndexesPage
                    v-else-if="page === CatalogViewerPage.Indexes"
                    :catalog-name="params.catalogName"
                    :entity-type="requestedEntityType"
                    :active="true"
                    :reload-token="reloadToken"
                />
                <MemoryPage
                    v-else-if="page === CatalogViewerPage.Memory"
                    :catalog-name="params.catalogName"
                    :active="true"
                    :reload-token="reloadToken"
                />
                <ActivityPage
                    v-else-if="page === CatalogViewerPage.Activity"
                    :catalog-name="params.catalogName"
                    :active="true"
                    :reload-token="reloadToken"
                />
                <HistoryPage
                    v-else-if="page === CatalogViewerPage.History"
                    :catalog-name="params.catalogName"
                    :active="true"
                    :reload-token="reloadToken"
                />
            </div>

            <VMissingDataIndicator
                v-if="catalog == undefined"
                icon="mdi-database-off-outline"
                :title="t('catalogViewer.unavailable.title')"
            />
        </VSheet>
    </div>
</template>

<style lang="scss" scoped>
.catalog-viewer {
    display: grid;
    grid-template-rows: 3rem 1fr;

    &__body {
        position: absolute;
        left: 0;
        right: 0;
        top: 3rem;
        bottom: 0;
        overflow-y: auto;
        padding: 1rem;
    }

    &__alert {
        margin-bottom: 1rem;
    }

    &__tabs {
        border-bottom: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
    }

    &__page {
        padding-top: 1rem;
    }
}
</style>
