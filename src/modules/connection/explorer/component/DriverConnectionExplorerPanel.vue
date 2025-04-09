<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ConnectionService, useConnectionService } from '@/modules/connection/service/ConnectionService'
import { Connection } from '@/modules/connection/model/Connection'
import Immutable from 'immutable'
import CreateCatalogDialog from '@/modules/connection/explorer/component/CreateCatalogDialog.vue'
import CatalogItem from '@/modules/connection/explorer/component/CatalogItem.vue'
import VTreeViewEmptyItem from '@/modules/base/component/VTreeViewEmptyItem.vue'
import { Catalog } from '@/modules/connection/model/Catalog'
import { provideConnection, provideServerStatus } from '@/modules/connection/explorer/component/dependecies'
import { ServerStatus } from '@/modules/connection/model/status/ServerStatus'
import { ConnectionItemType } from '@/modules/connection/explorer/model/ConnectionItemType'
import { MenuItem } from '@/modules/base/model/menu/MenuItem'
import { MenuAction } from '@/modules/base/model/menu/MenuAction'
import { Toaster, useToaster } from '@/modules/notification/service/Toaster'
import {
    GraphQLConsoleTabFactory,
    useGraphQLConsoleTabFactory
} from '@/modules/graphql-console/console/workspace/service/GraphQLConsoleTabFactory'
import {
    ServerViewerTabFactory,
    useServerStatusTabFactory
} from '@/modules/server-viewer/service/ServerViewerTabFactory'
import { TaskViewerTabFactory, useTaskViewerTabFactory } from '@/modules/task-viewer/services/TaskViewerTabFactory'
import { JfrViewerTabFactory, useJfrViewerTabFactory } from '@/modules/jfr-viewer/service/JfrViewerTabFactory'
import {
    TrafficRecordingsViewerTabFactory,
    useTrafficRecordingsViewerTabFactory
} from '@/modules/traffic-viewer/service/TrafficRecordingsViewerTabFactory'
import { BackupViewerTabFactory, useBackupsTabFactory } from '@/modules/backup-viewer/service/BackupViewerTabFactory'
import { useWorkspaceService, WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import { MenuSubheader } from '@/modules/base/model/menu/MenuSubheader'
import { BackupViewerTabDefinition } from '@/modules/backup-viewer/model/BackupViewerTabDefinition'
import { GraphQLInstanceType } from '@/modules/graphql-console/console/model/GraphQLInstanceType'
import {
    GraphQLConsoleTabDefinition
} from '@/modules/graphql-console/console/workspace/model/GraphQLConsoleTabDefinition'
import { JfrViewerTabDefinition } from '@/modules/jfr-viewer/model/JfrViewerTabDefinition'
import {
    TrafficRecordingsViewerTabDefinition
} from '@/modules/traffic-viewer/model/TrafficRecordingsViewerTabDefinition'
import { TaskViewerTabDefinition } from '@/modules/task-viewer/model/TaskViewerTabDefinition'
import { ServerViewerTabDefinition } from '@/modules/server-viewer/model/ServerViewerTabDefinition'
import { ApiType } from '@/modules/connection/model/status/ApiType'

const workspaceService: WorkspaceService = useWorkspaceService()
const connectionService: ConnectionService = useConnectionService()
const graphQLConsoleTabFactory: GraphQLConsoleTabFactory = useGraphQLConsoleTabFactory()
const serverStatusTabFactory: ServerViewerTabFactory = useServerStatusTabFactory()
const taskViewerTabFactory: TaskViewerTabFactory = useTaskViewerTabFactory()
const jfrViewerTabFactory: JfrViewerTabFactory = useJfrViewerTabFactory()
const trafficViewerTabFactory: TrafficRecordingsViewerTabFactory = useTrafficRecordingsViewerTabFactory()
const backupsService: BackupViewerTabFactory = useBackupsTabFactory()
const toaster: Toaster = useToaster()
const { t } = useI18n()

const connection: Connection = connectionService.getDriverConnection()
provideConnection(connection)

const serverStatus = ref<ServerStatus | undefined>()
provideServerStatus(serverStatus)

const actions = ref<Map<ConnectionItemType, MenuItem<ConnectionItemType>>>()
watch(
    [() => connection, serverStatus],
    async () => actions.value = await createActions(),
    { immediate: true }
)
const actionsOpened = ref<boolean>(false)
const actionList = computed<MenuItem<ConnectionItemType>[]>(() => {
    if (actions.value == undefined) {
        return []
    }
    return Array.from(actions.value.values())
})

const catalogs = ref<Immutable.List<Catalog>>()
const loading = ref<boolean>(false)

const showCreateCatalogDialog = ref<boolean>(false)

let loaded: boolean = false
async function load(): Promise<void> {
    if (loaded) {
        return
    }

    // todo lho revise
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

async function reload(): Promise<void> {
    // todo lho temp solution, connectionService.reload should be used when fixed
    loading.value = true
    await loadServerStatus()
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
        serverStatus.value = await connectionService.getServerStatus(connection)
        return true
    } catch (e: any) {
        await toaster.error(t(
            'explorer.connection.notification.couldNotLoadServerStatus',
            {
                connectionName: connection.name,
                reason: e.message
            }
        ))
        return false
    }
}

async function loadCatalogs(): Promise<boolean> {
    try {
        catalogs.value = (await connectionService.getCatalogs(connection, true))
            .sort((a: Catalog, b: Catalog) => {
                return a.name.localeCompare(b.name)
            })
        return true
    } catch (e: any) {
        await toaster.error(t(
            'explorer.connection.notification.couldNotLoadCatalogs',
            {
                connectionName: connection.name,
                reason: e.message
            }
        ))
        return false
    }
}

async function closeAllSessions(): Promise<void> {
    try {
        await connectionService.closeAllSessions(connection)
        await toaster.success(t(
            'explorer.connection.notification.closedAllSessions',
            { connectionName: connection.name }
        ))
    } catch (e: any) {
        await toaster.error(t(
            'explorer.connection.notification.couldNotCloseSessions',
            {
                connectionName: connection.name,
                reason: e.message
            }
        ))
    }
}

function handleAction(action: string): void {
    if (actions.value == undefined) {
        return
    }
    const item: MenuItem<ConnectionItemType> | undefined = actions.value.get(action as ConnectionItemType)
    if (item instanceof MenuAction) {
        item.execute()
    }
}

// todo lho these should be some kind of factories
async function createActions(): Promise<Map<ConnectionItemType, MenuItem<ConnectionItemType>>> {
    const graphQlEnabled: boolean = serverStatus.value != undefined && serverStatus.value.apiEnabled(ApiType.GraphQL)
    const observabilityEnabled: boolean = serverStatus.value != undefined && serverStatus.value.apiEnabled(ApiType.Observability)
    const serverReady: boolean = serverStatus.value != undefined
    const serverWritable: boolean = serverReady && !serverStatus.value!.readOnly

    const actions: Map<ConnectionItemType, MenuItem<ConnectionItemType>> = new Map()
    actions.set(
        ConnectionItemType.Server,
        createMenuAction(
            ConnectionItemType.Server,
            ServerViewerTabDefinition.icon(),
            () =>
                workspaceService.createTab(
                    serverStatusTabFactory.createNew(connection)
                ),
            serverReady
        )
    )
    actions.set(
        ConnectionItemType.Tasks,
        createMenuAction(
            ConnectionItemType.Tasks,
            TaskViewerTabDefinition.icon(),
            () => {
                workspaceService.createTab(
                    taskViewerTabFactory.createNew(connection)
                )
            },
            serverWritable
        )
    )
    actions.set(
        ConnectionItemType.TrafficRecordings,
        createMenuAction(
            ConnectionItemType.TrafficRecordings,
            TrafficRecordingsViewerTabDefinition.icon(),
            () => {
                workspaceService.createTab(
                    trafficViewerTabFactory.createNew(connection)
                )
            },
            serverWritable
        )
    )
    actions.set(
        ConnectionItemType.JfrRecordings,
        createMenuAction(
            ConnectionItemType.JfrRecordings,
            JfrViewerTabDefinition.icon(),
            () => {
                workspaceService.createTab(
                    jfrViewerTabFactory.createNew(
                        connection
                    )
                )
            },
            serverWritable && observabilityEnabled
        )
    )
    actions.set(
        ConnectionItemType.GraphQLSystemAPIConsole,
        createMenuAction(
            ConnectionItemType.GraphQLSystemAPIConsole,
            GraphQLConsoleTabDefinition.icon(),
            () =>
                workspaceService.createTab(
                    graphQLConsoleTabFactory.createNew(
                        connection,
                        'system', // todo lho: this is not needed
                        GraphQLInstanceType.System
                    )
                ),
            graphQlEnabled
        )
    )

    actions.set(
        ConnectionItemType.ManageSubheader,
        new MenuSubheader(t('explorer.connection.subheader.manage'))
    )
    actions.set(
        ConnectionItemType.Refresh,
        createMenuAction(
            ConnectionItemType.Refresh,
            'mdi-refresh',
            async () => await reload()
        )
    )
    actions.set(
        ConnectionItemType.CloseAllSessions,
        createMenuAction(
            ConnectionItemType.CloseAllSessions,
            'mdi-lan-disconnect',
            () => closeAllSessions(),
            serverReady
        )
    )

    actions.set(
        ConnectionItemType.CatalogsSubheader,
        new MenuSubheader(t('explorer.connection.subheader.catalogs'))
    )
    actions.set(
        ConnectionItemType.CreateCatalog,
        createMenuAction(
            ConnectionItemType.CreateCatalog,
            'mdi-plus',
            () => showCreateCatalogDialog.value = true,
            serverWritable
        )
    )
    actions.set(
        ConnectionItemType.CatalogBackups,
        createMenuAction(
            ConnectionItemType.CatalogBackups,
            BackupViewerTabDefinition.icon(),
            () => {
                workspaceService.createTab(
                    backupsService.createNew(connection)
                )
            },
            serverWritable
        )
    )
    return actions
}
function createMenuAction(
    actionType: ConnectionItemType,
    prependIcon: string,
    execute: () => void,
    enabled: boolean = true
): MenuAction<ConnectionItemType> {
    return new MenuAction(
        actionType,
        t(`explorer.connection.actions.${actionType}`),
        prependIcon,
        execute,
        undefined,
        !enabled
    )
}

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
                <span class="text-gray-light text-sm-body-2 font-weight-medium">{{ t('explorer.title') }}</span>

                <VMenu
                    :menu-items="actions"
                    v-model="actionsOpened"
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
                        :items="actionList"
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
                    @change="loadCatalogs"
                />
            </template>
            <template v-else>
                <VTreeViewEmptyItem />
            </template>

            <CreateCatalogDialog
                v-if="showCreateCatalogDialog"
                v-model="showCreateCatalogDialog"
                :connection="connection"
                @create="loadCatalogs"
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
</style>
