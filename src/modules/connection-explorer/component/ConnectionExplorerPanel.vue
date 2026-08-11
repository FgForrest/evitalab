<script setup lang="ts">
import { errorMessage } from '@/utils/error'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { List as ImmutableList } from 'immutable'
import CreateCatalogDialog from '@/modules/connection-explorer/component/CreateCatalogDialog.vue'
import CatalogItem from '@/modules/connection-explorer/component/CatalogItem.vue'
import VTreeViewEmptyItem from '@/modules/base/component/VTreeViewEmptyItem.vue'
import { provideServerStatus } from '@/modules/connection-explorer/component/dependecies'
import type { MenuItem } from '@/modules/base/model/menu/MenuItem'
import { MenuAction } from '@/modules/base/model/menu/MenuAction'
import { useToaster } from '@/modules/notification/service/Toaster'
import type { Toaster } from '@/modules/notification/service/Toaster'
import { ServerStatus } from '@/modules/database-driver/request-response/status/ServerStatus'
import { ConnectionMenuItemType } from '@/modules/connection-explorer/model/ConnectionMenuItemType'
import { CatalogStatistics } from '@/modules/database-driver/request-response/CatalogStatistics'
import {
    ConnectionExplorerService,
    useConnectionExplorerService
} from '@/modules/connection-explorer/service/ConnectionExplorerService'
import {
    ConnectionExplorerPanelMenuFactory, useConnectionExplorerPanelMenuFactory
} from '@/modules/connection-explorer/service/ConnectionExplorerPanelMenuFactory'
import ConnectionExplorerPanelResizer from '@/modules/connection-explorer/component/ConnectionExplorerPanelResizer.vue'
import { clampPanelWidth, maxPanelWidth, minPanelWidth } from '@/modules/connection-explorer/model/panelWidth'

const retryInterval: number = 5000

const connectionExplorerService: ConnectionExplorerService = useConnectionExplorerService()
const connectionExplorerPanelMenuFactory: ConnectionExplorerPanelMenuFactory = useConnectionExplorerPanelMenuFactory()
const toaster: Toaster = useToaster()
const { t } = useI18n()

let loaded: boolean = false
const loading = ref<boolean>(false)
let retryTimeoutId: ReturnType<typeof setTimeout> | undefined = undefined

const serverStatus = ref<ServerStatus | undefined>()
const serverStatusChangeCallbackId: string = connectionExplorerService.registerServerStatusChangeCallback(async () => {
    await loadServerStatus()
})
provideServerStatus(serverStatus)

const catalogs = ref<ImmutableList<CatalogStatistics> | undefined>()
const catalogChangeCallbackId: string = connectionExplorerService.registerCatalogChangeCallback(async () => {
    await loadCatalogs()
})
const showCreateCatalogDialog = ref<boolean>(false)

/**
 * Whether evitaLab is currently offline. Badged here, on the connection the outage belongs to; the status bar
 * separately reports whether the *data on screen* is verified, which is a different question.
 */
const offline = connectionExplorerService.serverUnreachable

/**
 * The width the user chose, as restored from the previous lab run. Kept separately from the width the panel
 * actually gets, so that a preference too wide for the current viewport comes back when the window grows again.
 */
const preferredPanelWidth = ref<number>(connectionExplorerService.getPanelWidth())
const viewportWidth = ref<number>(window.innerWidth)
const maxWidth = computed<number>(() => maxPanelWidth(viewportWidth.value))

/**
 * Width the panel is rendered with - the preferred width fitted to the current viewport.
 */
const panelWidth = computed<number>({
    get: () => clampPanelWidth(preferredPanelWidth.value, viewportWidth.value),
    set: (width: number) => preferredPanelWidth.value = width
})

function updateViewportWidth(): void {
    viewportWidth.value = window.innerWidth
}

function persistPanelWidth(): void {
    connectionExplorerService.setPanelWidth(preferredPanelWidth.value)
}

const menuItems = ref<Map<ConnectionMenuItemType, MenuItem<ConnectionMenuItemType>>>()
watch(
    serverStatus,
    async () => menuItems.value = await createMenuItems(),
    { immediate: true }
)
const menuOpened = ref<boolean>(false)
const menuItemList = computed<MenuItem<ConnectionMenuItemType>[]>(() => {
    if (menuItems.value == undefined) {
        return []
    }
    return Array.from(menuItems.value.values())
})

async function load(): Promise<void> {
    if (loaded) {
        return
    }

    loading.value = true
    // the catalog listing is attempted even when the server status could not be fetched: it may be served
    // from the persistent cache, which is what keeps the explorer usable while the server is unreachable
    const serverReachable: boolean = await loadServerStatus()
    const catalogsLoaded: boolean = await loadCatalogs()
    loaded = serverReachable && catalogsLoaded
    loading.value = false
}

async function loadServerStatus(silent: boolean = false): Promise<boolean> {
    try {
        serverStatus.value = await connectionExplorerService.getServerStatus()
        // recovered — cancel any pending background retry
        cancelServerStatusRetry()
        return true
    } catch (e) {
        // drop stale status so the menu actions disable against an unreachable server
        serverStatus.value = undefined
        if (!silent) {
            await toaster.error(t(
                'explorer.connection.notification.couldNotLoadServerStatus',
                { reason: errorMessage(e) }
            ))
        }
        scheduleServerStatusRetry()
        return false
    }
}

function cancelServerStatusRetry(): void {
    if (retryTimeoutId != undefined) {
        clearTimeout(retryTimeoutId)
        retryTimeoutId = undefined
    }
}

function scheduleServerStatusRetry(): void {
    // guard against parallel loops racing with a Reload click or a change callback
    cancelServerStatusRetry()
    retryTimeoutId = setTimeout(async () => {
        retryTimeoutId = undefined
        // background retries stay quiet until the server is reachable again
        const reachable: boolean = await loadServerStatus(true)
        if (reachable) {
            // the initial load() chain skipped catalogs; complete the recovery here
            await loadCatalogs()
        }
    }, retryInterval)
}

async function loadCatalogs(): Promise<boolean> {
    // an unreachable server (per the server status) is not a reason to skip this: the driver may still
    // serve the catalog listing from its persistent cache, and that is exactly what makes the explorer —
    // and with it every catalog-scoped tab — usable while the server is down
    const serverReachable: boolean = serverStatus.value != undefined
    try {
        catalogs.value = await connectionExplorerService.getCatalogs()
        return true
    } catch (e) {
        if (serverReachable) {
            await toaster.error(t(
                'explorer.connection.notification.couldNotLoadCatalogs',
                { reason: errorMessage(e) }
            ))
        }
        // nothing cached and no server: the status error already told the user, so no second failure
        return false
    }
}

async function createMenuItems(): Promise<Map<ConnectionMenuItemType, MenuItem<ConnectionMenuItemType>>> {
    return connectionExplorerPanelMenuFactory.createItems(
        serverStatus.value,
        () => showCreateCatalogDialog.value = true,
        () => loading.value = true,
        () => loading.value = false,
        () => void clearLocalCache()
    )
}

/**
 * Discards evitaLab's on-disk copy of this server's data. Purely local: nothing on the server is touched and
 * the data comes back on the next read, so it needs no confirmation — only feedback.
 */
async function clearLocalCache(): Promise<void> {
    loading.value = true
    try {
        // reports whether evitaLab can persist anything at all: with storage the browser refuses, the purge
        // cannot have had anything to do, and claiming success would be a lie
        const cleared: boolean = await connectionExplorerService.clearLocalCache()
        await toaster.success(t(cleared
            ? 'explorer.connection.notification.localCacheCleared'
            : 'explorer.connection.notification.localCacheUnavailable'))
    } catch (e) {
        await toaster.error(t(
            'explorer.connection.notification.couldNotClearLocalCache',
            { reason: errorMessage(e) }
        ))
    } finally {
        loading.value = false
    }
}

function handleAction(action: string): void {
    if (menuItems.value == undefined) {
        return
    }
    const item: MenuItem<ConnectionMenuItemType> | undefined = menuItems.value.get(action as ConnectionMenuItemType)
    if (item instanceof MenuAction) {
        item.execute()
    }
}

onMounted(() => {
    window.addEventListener('resize', updateViewportWidth)
})

onUnmounted(() => {
    connectionExplorerService.unregisterServerStatusChangeCallback(serverStatusChangeCallbackId)
    connectionExplorerService.unregisterCatalogChangeCallback(catalogChangeCallbackId)
    cancelServerStatusRetry()
    window.removeEventListener('resize', updateViewportWidth)
})

load().then()
</script>

<template>
    <VNavigationDrawer
        permanent
        :width="panelWidth"
        @update:model-value="$emit('update:modelValue', $event)"
        class="bg-primary connection-explorer-panel"
    >
        <VList
            density="compact"
            nav
        >
            <div class="panel-header">
                <span class="text-gray-light text-sm-body-2 font-weight-medium">
                  <span class="d-inline-flex align-center panel-title">
                    <span class="panel-title-text">{{ t('explorer.title') }}</span>
                    <VTooltip location="bottom">
                      {{ t('explorer.readOnlyToolTip') }}
                        <template #activator="{ props }">
                        <VIcon
                            v-if="serverStatus?.readOnly"
                            v-bind="props"
                            class="icon"
                            icon="mdi-eye-outline"
                        />
                      </template>
                    </VTooltip>
                    <VTooltip location="bottom">
                      {{ t('explorer.offlineModeToolTip') }}
                        <template #activator="{ props }">
                        <VIcon
                            v-if="offline"
                            v-bind="props"
                            class="icon"
                            icon="mdi-cloud-off-outline"
                            color="warning"
                        />
                      </template>
                    </VTooltip>
                  </span>
                </span>


                <VMenu
                    :menu-items="menuItems"
                    v-model="menuOpened"
                >
                    <template #activator="{ props }">
                        <VProgressCircular
                            v-if="loading"
                            v-bind="props"
                            indeterminate
                            size="16"
                            class="connection-loading"
                        />
                        <VIcon
                            v-else
                            v-bind="props"
                            class="text-gray-light"
                        >
                            mdi-dots-vertical
                        </VIcon>
                    </template>

                    <VList
                        density="compact"
                        :items="menuItemList"
                        @click:select="handleAction($event.id as string)"
                    >
                        <template #item="{ props }">
                            <VListItem
                                :prepend-icon="props.prependIcon"
                                :value="props.value"
                                :disabled="props.disabled"
                            >
                                {{ props.title }}
                            </VListItem>
                        </template>
                    </VList>
                </VMenu>
            </div>

            <template v-if="catalogs != undefined && catalogs.size > 0">
                <CatalogItem
                    v-for="catalog in catalogs"
                    :key="catalog.name"
                    :catalog="catalog"
                />
            </template>
            <template v-else>
                <VTreeViewEmptyItem />
            </template>

            <CreateCatalogDialog
                v-if="showCreateCatalogDialog"
                v-model="showCreateCatalogDialog"
            />
        </VList>

        <template #append>
            <ConnectionExplorerPanelResizer
                v-model="panelWidth"
                :min="minPanelWidth"
                :max="maxWidth"
                @resize-end="persistPanelWidth"
            />
        </template>
    </VNavigationDrawer>
</template>

<style lang="scss" scoped>
// the tab area follows the panel through `--v-layout-left`, which is not animated - so the drawer must not
// animate its width either, otherwise the two visibly desync on every width change. The panel is permanent,
// so nothing else about it was ever animated
.connection-explorer-panel {
    transition: none;
}

.panel-header {
    width: 100%;
    display: inline-grid;
    // `minmax(0, auto)` lets the title column shrink below its content, which is what allows the title to
    // truncate instead of pushing the status badges and the menu out of a narrow panel
    grid-template-columns: minmax(0, auto) 1.5rem;
    gap: 0.5rem;
    padding: 0 0.5rem 0 0.5rem;
    height: 2rem;
    align-items: center;

    > span {
        min-width: 0;
    }
}

.panel-title {
    // the badges keep their size, only the title gives way
    max-width: 100%;

    > :not(.panel-title-text) {
        flex: 0 0 auto;
    }
}

.panel-title-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.connection-loading {
    justify-self: center;
}

.icon {
    padding-left: 1rem;
    padding-right: 1rem;
}
</style>
