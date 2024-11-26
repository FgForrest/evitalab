<script setup lang="ts">
/**
 * Explorer tree item representing a single connection to evitaDB.
 */

import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWorkspaceService, WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import { ConnectionService, useConnectionService } from '@/modules/connection/service/ConnectionService'
import { Toaster, useToaster } from '@/modules/notification/service/Toaster'
import { Connection } from '@/modules/connection/model/Connection'
import { EvitaLabConfig, useEvitaLabConfig } from '@/modules/config/EvitaLabConfig'
import { Catalog } from '@/modules/connection/model/Catalog'
import {
    GraphQLConsoleTabFactory,
    useGraphQLConsoleTabFactory
} from '@/modules/graphql-console/console/workspace/service/GraphQLConsoleTabFactory'
import { GraphQLInstanceType } from '@/modules/graphql-console/console/model/GraphQLInstanceType'
import { ConnectionItemType } from '@/modules/connection/explorer/model/ConnectionItemType'
import { MenuAction } from '@/modules/base/model/menu/MenuAction'
import { provideConnection, provideServerStatus } from '@/modules/connection/explorer/component/dependecies'
import VTreeViewItem from '@/modules/base/component/VTreeViewItem.vue'
import CatalogItem from '@/modules/connection/explorer/component/CatalogItem.vue'
import RemoveConnectionDialog from '@/modules/connection/explorer/component/RemoveConnectionDialog.vue'
import VTreeViewEmptyItem from '@/modules/base/component/VTreeViewEmptyItem.vue'
import { MenuSubheader } from '@/modules/base/model/menu/MenuSubheader'
import { MenuItem } from '@/modules/base/model/menu/MenuItem'
import {
    ServerViewerTabFactory,
    useServerStatusTabFactory
} from '@/modules/server-viewer/service/ServerViewerTabFactory'
import CreateCatalogDialog from '@/modules/connection/explorer/component/CreateCatalogDialog.vue'
import { TaskViewerTabFactory, useTaskViewerTabFactory } from '@/modules/task-viewer/services/TaskViewerTabFactory'
import { JfrViewerTabFactory, useJfrViewerTabFactory } from '@/modules/jfr-viewer/service/JfrViewerTabFactory'
import { ItemFlag } from '@/modules/base/model/tree-view/ItemFlag'
import Immutable from 'immutable'
import { ServerStatus } from '@/modules/connection/model/status/ServerStatus'
import { ApiType } from '@/modules/connection/model/status/ApiType'
import { BackupViewerTabFactory, useBackupsTabFactory } from '@/modules/backup-viewer/service/BackupViewerTabFactory'
import {
    GraphQLConsoleTabDefinition
} from '@/modules/graphql-console/console/workspace/model/GraphQLConsoleTabDefinition'
import { ServerViewerTabDefinition } from '@/modules/server-viewer/model/ServerViewerTabDefinition'
import { TaskViewerTabDefinition } from '@/modules/task-viewer/model/TaskViewerTabDefinition'
import { JfrViewerTabDefinition } from '@/modules/jfr-viewer/model/JfrViewerTabDefinition'
import { BackupViewerTabDefinition } from '@/modules/backup-viewer/model/BackupViewerTabDefinition'

const evitaLabConfig: EvitaLabConfig = useEvitaLabConfig()
const workspaceService: WorkspaceService = useWorkspaceService()
const connectionService: ConnectionService = useConnectionService()
const graphQLConsoleTabFactory: GraphQLConsoleTabFactory = useGraphQLConsoleTabFactory()
const serverStatusTabFactory: ServerViewerTabFactory = useServerStatusTabFactory()
const taskViewerTabFactory: TaskViewerTabFactory = useTaskViewerTabFactory()
const jfrViewerTabFactory: JfrViewerTabFactory = useJfrViewerTabFactory()
const backupsService: BackupViewerTabFactory = useBackupsTabFactory()

const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<{
    connection: Connection
}>()
provideConnection(props.connection)

const serverStatus = ref<ServerStatus | undefined>()
provideServerStatus(serverStatus)

const flags = computed<ItemFlag[]>(() => {
    const flags: ItemFlag[] = []
    if (props.connection.preconfigured) {
        flags.push(ItemFlag.info(
            t('explorer.connection.flag.preconfigured')
        ))
    }
    return flags
})
const actions = ref<Map<ConnectionItemType, MenuItem<ConnectionItemType>>>()
watch(
    [() => props.connection, serverStatus],
    async () => actions.value = await createActions(),
    { immediate: true }
)
const actionList = computed<MenuItem<ConnectionItemType>[]>(() => {
    if (actions.value == undefined) {
        return []
    }
    return Array.from(actions.value.values())
})

const catalogs = ref<Immutable.List<Catalog>>()
const loading = ref<boolean>(false)

const showRemoveConnectionDialog = ref<boolean>(false)
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
        serverStatus.value = await connectionService.getServerStatus(props.connection)
        return true
    } catch (e: any) {
        toaster.error(t(
            'explorer.connection.notification.couldNotLoadServerStatus',
            {
                connectionName: props.connection.name,
                reason: e.message
            }
        ))
        return false
    }
}

async function loadCatalogs(): Promise<boolean> {
    try {
        catalogs.value = (await connectionService.getCatalogs(props.connection, true))
            .sort((a: Catalog, b: Catalog) => {
                return a.name.localeCompare(b.name)
            })
        return true
    } catch (e: any) {
        toaster.error(t(
            'explorer.connection.notification.couldNotLoadCatalogs',
            {
                connectionName: props.connection.name,
                reason: e.message
            }
        ))
        return false
    }
}

async function closeAllSessions(): Promise<void> {
    try {
        await connectionService.closeAllSessions(props.connection)
        toaster.success(t(
            'explorer.connection.notification.closedAllSessions',
            { connectionName: props.connection.name }
        ))
    } catch (e: any) {
        toaster.error(t(
            'explorer.connection.notification.couldNotCloseSessions',
            {
                connectionName: props.connection.name,
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
    const userConnection: boolean = !props.connection.preconfigured
    const labWritable: boolean = !evitaLabConfig.readOnly
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
                    serverStatusTabFactory.createNew(props.connection)
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
                    taskViewerTabFactory.createNew(
                        props.connection
                    )
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
                        props.connection
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
                        props.connection,
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
        ConnectionItemType.ModifySubheader,
        new MenuSubheader(t('explorer.connection.subheader.modify'))
    )
    // todo lho implement
    // actions.set(
    //     ConnectionActionType.Edit,
    //     createMenuAction(
    //         ConnectionActionType.Edit,
    //         'mdi-pencil',
    //         () => {
    //             throw new UnexpectedError('Not implemented yet.')
    //         },
    //          props.connection.preconfigured
    //     )
    // )
    actions.set(
        ConnectionItemType.Remove,
        createMenuAction(
            ConnectionItemType.Remove,
            'mdi-delete-outline',
            () => (showRemoveConnectionDialog.value = true),
            userConnection && labWritable
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
                    backupsService.createNew(props.connection)
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
</script>

<template>
    <div>
        <VListGroup :value="connection.name">
            <template #activator="{ isOpen, props }">
                <VTreeViewItem
                    v-bind="props"
                    openable
                    :is-open="isOpen"
                    prepend-icon="mdi-power-plug-outline"
                    :loading="loading"
                    :flags="flags"
                    :actions="actionList"
                    @click="load()"
                    @click:action-menu="load()"
                    @click:action="handleAction"
                >
                    {{ connection.name }}
                </VTreeViewItem>
            </template>

            <div v-if="catalogs !== undefined">
                <template v-if="catalogs.size > 0">
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
            </div>

            <RemoveConnectionDialog
                v-if="showRemoveConnectionDialog"
                v-model="showRemoveConnectionDialog"
                :connection="connection"
            />
            <CreateCatalogDialog
                v-if="showCreateCatalogDialog"
                v-model="showCreateCatalogDialog"
                :connection="connection"
                @create="loadCatalogs"
            />
        </VListGroup>
    </div>
</template>

<style lang="scss" scoped></style>
