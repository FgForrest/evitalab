<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
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

const connectionExplorerService: ConnectionExplorerService = useConnectionExplorerService()
const connectionExplorerPanelMenuFactory: ConnectionExplorerPanelMenuFactory = useConnectionExplorerPanelMenuFactory()
const toaster: Toaster = useToaster()
const { t } = useI18n()

let loaded: boolean = false
const loading = ref<boolean>(false)

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
    loaded = await loadServerStatus()
        .then((loaded) => {
            if (!loaded) {
                return false
            }
            return loadCatalogs()
        })
    loading.value = false
}

async function loadServerStatus(): Promise<boolean> {
    try {
        serverStatus.value = await connectionExplorerService.getServerStatus()
        return true
    } catch (e: any) {
        await toaster.error(t(
            'explorer.connection.notification.couldNotLoadServerStatus',
            { reason: e.message }
        ))
        return false
    }
}

async function loadCatalogs(): Promise<boolean> {
    try {
        catalogs.value = await connectionExplorerService.getCatalogs()
        return true
    } catch (e: any) {
        await toaster.error(t(
            'explorer.connection.notification.couldNotLoadCatalogs',
            { reason: e.message }
        ))
        return false
    }
}

async function createMenuItems(): Promise<Map<ConnectionMenuItemType, MenuItem<ConnectionMenuItemType>>> {
    return connectionExplorerPanelMenuFactory.createItems(
        serverStatus.value,
        () => showCreateCatalogDialog.value = true,
        () => loading.value = true,
        () => loading.value = false
    )
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

onUnmounted(() => {
    connectionExplorerService.unregisterServerStatusChangeCallback(serverStatusChangeCallbackId)
    connectionExplorerService.unregisterCatalogChangeCallback(catalogChangeCallbackId)
})

load().then()
</script>

<template>
    <VNavigationDrawer
        permanent
        :width="325"
        @update:model-value="$emit('update:modelValue', $event)"
        class="bg-primary"
    >
        <VList
            density="compact"
            nav
        >
            <div class="panel-header">
                <span class="text-gray-light text-sm-body-2 font-weight-medium">
                  <span class="d-inline-flex align-center">
                    {{ t('explorer.title') }}
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
    </VNavigationDrawer>
</template>

<style lang="scss" scoped>
.panel-header {
    width: 100%;
    display: inline-grid;
    grid-template-columns: auto 1.5rem;
    gap: 0.5rem;
    padding: 0 0.5rem 0 0.5rem;
    height: 2rem;
    align-items: center;
}

.connection-loading {
    justify-self: center;
}

.icon {
    padding-left: 1rem;
    padding-right: 1rem;
}
</style>
