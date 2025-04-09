<script setup lang="ts">
/**
 * Explorer tree item representing a single catalog in evitaDB.
 */

import { computed, ref, Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Catalog } from '@/modules/connection/model/Catalog'
import { Connection } from '@/modules/connection/model/Connection'
import { MenuAction } from '@/modules/base/model/menu/MenuAction'
import { CatalogItemType } from '@/modules/connection/explorer/model/CatalogItemType'
import { GraphQLInstanceType } from '@/modules/graphql-console/console/model/GraphQLInstanceType'
import { CatalogSchemaPointer } from '@/modules/schema-viewer/viewer/model/CatalogSchemaPointer'
import { useWorkspaceService, WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import {
    EvitaQLConsoleTabFactory,
    useEvitaQLConsoleTabFactory
} from '@/modules/evitaql-console/console/workspace/service/EvitaQLConsoleTabFactory'
import {
    GraphQLConsoleTabFactory,
    useGraphQLConsoleTabFactory
} from '@/modules/graphql-console/console/workspace/service/GraphQLConsoleTabFactory'
import {
    SchemaViewerTabFactory,
    useSchemaViewerTabFactory
} from '@/modules/schema-viewer/viewer/workspace/service/SchemaViewerTabFactory'
import VTreeViewItem from '@/modules/base/component/VTreeViewItem.vue'
import VTreeViewEmptyItem from '@/modules/base/component/VTreeViewEmptyItem.vue'
import CollectionItem from '@/modules/connection/explorer/component/CollectionItem.vue'
import { provideCatalog, useConnection, useServerStatus } from '@/modules/connection/explorer/component/dependecies'
import { MenuItem } from '@/modules/base/model/menu/MenuItem'
import { MenuSubheader } from '@/modules/base/model/menu/MenuSubheader'
import RenameCatalogDialog from '@/modules/connection/explorer/component/RenameCatalogDialog.vue'
import DropCatalogDialog from '@/modules/connection/explorer/component/DropCatalogDialog.vue'
import ReplaceCatalogDialog from '@/modules/connection/explorer/component/ReplaceCatalogDialog.vue'
import CreateCollectionDialog from '@/modules/connection/explorer/component/CreateCollectionDialog.vue'
import SwitchCatalogToAliveStateDialog
    from '@/modules/connection/explorer/component/SwitchCatalogToAliveStateDialog.vue'
import { ItemFlag } from '@/modules/base/model/tree-view/ItemFlag'
import { EntityCollection } from '@/modules/connection/model/EntityCollection'
import Immutable from 'immutable'
import { ServerStatus } from '@/modules/connection/model/status/ServerStatus'
import { ApiType } from '@/modules/connection/model/status/ApiType'
import {
    EvitaQLConsoleTabDefinition
} from '@/modules/evitaql-console/console/workspace/model/EvitaQLConsoleTabDefinition'
import {
    GraphQLConsoleTabDefinition
} from '@/modules/graphql-console/console/workspace/model/GraphQLConsoleTabDefinition'
import { SchemaViewerTabDefinition } from '@/modules/schema-viewer/viewer/workspace/model/SchemaViewerTabDefinition'
import { ConnectionService, useConnectionService } from '@/modules/connection/service/ConnectionService'
import { Toaster, useToaster } from '@/modules/notification/service/Toaster'
import { TrafficRecordHistoryViewerTabDefinition } from '@/modules/traffic-viewer/model/TrafficRecordHistoryViewerTabDefinition'
import {
    TrafficRecordHistoryViewerTabFactory,
    useTrafficRecordHistoryViewerTabFactory
} from '@/modules/traffic-viewer/service/TrafficRecordHistoryViewerTabFactory'

const workspaceService: WorkspaceService = useWorkspaceService()
const connectionService: ConnectionService = useConnectionService()
const evitaQLConsoleTabFactory: EvitaQLConsoleTabFactory = useEvitaQLConsoleTabFactory()
const graphQLConsoleTabFactory: GraphQLConsoleTabFactory = useGraphQLConsoleTabFactory()
const schemaViewerTabFactory: SchemaViewerTabFactory = useSchemaViewerTabFactory()
const trafficRecordHistoryViewerTabFactory: TrafficRecordHistoryViewerTabFactory = useTrafficRecordHistoryViewerTabFactory()
const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<{
    catalog: Catalog
}>()
const emit = defineEmits<{ (e: 'change'): void }>()
const serverStatus: Ref<ServerStatus | undefined> = useServerStatus()

const showRenameCatalogDialog = ref<boolean>(false)
const showReplaceCatalogDialog = ref<boolean>(false)
const showSwitchCatalogToAliveStateDialog = ref<boolean>(false)
const showDropCatalogDialog = ref<boolean>(false)
const showCreateCollectionDialog = ref<boolean>(false)

const connection: Connection = useConnection()
const flags = computed<ItemFlag[]>(() => {
    const flags: ItemFlag[] = []
    if (props.catalog.corrupted) {
        flags.push(ItemFlag.error(t('explorer.catalog.flag.corrupted')))
    }
    if (props.catalog.isInWarmup) {
        flags.push(ItemFlag.warning(t('explorer.catalog.flag.warmingUp')))
    }
    return flags
})
const actions = computed<Map<CatalogItemType, MenuItem<CatalogItemType>>>(() => createActions())
const actionList = computed<MenuItem<CatalogItemType>[]>(() => Array.from(actions.value.values()))

const entityCollections = computed<Immutable.List<EntityCollection>>(() => {
    return Immutable.List<EntityCollection>(props.catalog.entityCollections)
        .sort((a: EntityCollection, b: EntityCollection) => {
            return a.entityType.localeCompare(b.entityType)
        })
})

const catalogRef = ref(props.catalog)
provideCatalog(catalogRef as Ref<Catalog>)

const loading = ref<boolean>(false)

async function closeAllSessions(): Promise<void> {
    try {
        await connectionService.closeAllSessions(connection, props.catalog.name)
        await toaster.success(t(
            'explorer.catalog.notification.closedAllSessions',
            { catalogName: props.catalog.name }
        ))
    } catch (e: any) {
        await toaster.error(t(
            'explorer.catalog.notification.couldNotCloseSessions',
            {
                catalogName: props.catalog.name,
                reason: e.message
            }
        ))
    }
}

function handleAction(action: string): void {
    const foundedAction = actions.value?.get(action as CatalogItemType)
    if (foundedAction && foundedAction instanceof MenuAction) {
        (foundedAction as MenuAction<CatalogItemType>).execute()
    }
}

function createActions(): Map<CatalogItemType, MenuItem<CatalogItemType>> {
    const graphQlEnabled: boolean = serverStatus.value != undefined && serverStatus.value.apiEnabled(ApiType.GraphQL)
    const catalogNotCorrupted: boolean = !props.catalog.corrupted
    const serverWritable: boolean = serverStatus.value != undefined && !serverStatus.value.readOnly

    const actions: Map<CatalogItemType, MenuItem<CatalogItemType>> = new Map()
    actions.set(
        CatalogItemType.EvitaQLConsole,
        createMenuAction(
            CatalogItemType.EvitaQLConsole,
            EvitaQLConsoleTabDefinition.icon(),
            () => {
                workspaceService.createTab(
                    evitaQLConsoleTabFactory.createNew(
                        connection,
                        props.catalog.name
                    )
                )
            },
            catalogNotCorrupted
        )
    )
    actions.set(
        CatalogItemType.GraphQLDataAPIConsole,
        createMenuAction(
            CatalogItemType.GraphQLDataAPIConsole,
            GraphQLConsoleTabDefinition.icon(),
            () => {
                workspaceService.createTab(
                    graphQLConsoleTabFactory.createNew(
                        connection,
                        props.catalog.name,
                        GraphQLInstanceType.Data
                    )
                )
            },
            catalogNotCorrupted && graphQlEnabled
        )
    )
    actions.set(
        CatalogItemType.GraphQLSchemaAPIConsole,
        createMenuAction(
            CatalogItemType.GraphQLSchemaAPIConsole,
            GraphQLConsoleTabDefinition.icon(),
            () => {
                workspaceService.createTab(
                    graphQLConsoleTabFactory.createNew(
                        connection,
                        props.catalog.name,
                        GraphQLInstanceType.Schema
                    )
                )
            },
            catalogNotCorrupted && graphQlEnabled
        )
    )
    actions.set(
        CatalogItemType.ViewSchema,
        createMenuAction(
            CatalogItemType.ViewSchema,
            SchemaViewerTabDefinition.icon(),
            () => {
                workspaceService.createTab(
                    schemaViewerTabFactory.createNew(
                        connection,
                        new CatalogSchemaPointer(props.catalog.name)
                    )
                )
            },
            catalogNotCorrupted
        )
    )

    actions.set(
        CatalogItemType.TrafficSubheader,
        new MenuSubheader(t('explorer.catalog.subheader.traffic'))
    )
    actions.set(
        CatalogItemType.ActiveTrafficRecording,
        createMenuAction(
            CatalogItemType.ActiveTrafficRecording,
            TrafficRecordHistoryViewerTabDefinition.icon(),
            () => workspaceService.createTab(
                trafficRecordHistoryViewerTabFactory.createNew(
                    connection,
                    props.catalog.name
                )
            ),
            catalogNotCorrupted && serverWritable
        )
    )

    actions.set(
        CatalogItemType.ManageSubheader,
        new MenuSubheader(t('explorer.catalog.subheader.manage'))
    )
    actions.set(
        CatalogItemType.CloseAllSessions,
        createMenuAction(
            CatalogItemType.CloseAllSessions,
            'mdi-lan-disconnect',
            () => closeAllSessions()
        )
    )

    actions.set(
        CatalogItemType.ModifySubheader,
        new MenuSubheader(t('explorer.catalog.subheader.modify'))
    )
    actions.set(
        CatalogItemType.RenameCatalog,
        createMenuAction(
            CatalogItemType.RenameCatalog,
            'mdi-pencil-outline',
            () => showRenameCatalogDialog.value = true,
            catalogNotCorrupted && serverWritable
        )
    )
    actions.set(
        CatalogItemType.ReplaceCatalog,
        createMenuAction(
            CatalogItemType.ReplaceCatalog,
            'mdi-file-replace-outline',
            () => showReplaceCatalogDialog.value = true,
            catalogNotCorrupted && serverWritable
        )
    )
    if (props.catalog.isInWarmup) {
        actions.set(
            CatalogItemType.SwitchCatalogToAliveState,
            createMenuAction(
                CatalogItemType.SwitchCatalogToAliveState,
                'mdi-toggle-switch-outline',
                () => showSwitchCatalogToAliveStateDialog.value = true,
                catalogNotCorrupted && serverWritable
            )
        )
    }
    actions.set(
        CatalogItemType.DropCatalog,
        createMenuAction(
            CatalogItemType.DropCatalog,
            'mdi-delete-outline',
            () => showDropCatalogDialog.value = true,
            serverWritable
        )
    )

    actions.set(
        CatalogItemType.CollectionsSubheader,
        new MenuSubheader(t('explorer.catalog.subheader.collections'))
    )

    actions.set(
        CatalogItemType.CreateCollection,
        createMenuAction(
            CatalogItemType.CreateCollection,
            'mdi-plus',
            () => showCreateCollectionDialog.value = true,
            catalogNotCorrupted && serverWritable
        )
    )
    return new Map(actions)
}

function createMenuAction(
    actionType: CatalogItemType,
    prependIcon: string,
    execute: () => void,
    enabled: boolean = true
): MenuItem<CatalogItemType> {
    return new MenuAction(
        actionType,
        t(`explorer.catalog.actions.${actionType}`),
        prependIcon,
        execute,
        undefined,
        !enabled
    )
}
</script>

<template>
    <VListGroup :value="`${connection.name}|${catalog.name}`">
        <template #activator="{ isOpen, props }">
            <VTreeViewItem
                v-bind="props"
                :openable="!catalog.corrupted"
                :is-open="isOpen"
                prepend-icon="mdi-menu"
                :loading="loading"
                :flags="flags"
                :actions="actionList"
                @click:action="handleAction"
                class="text-gray-light"
            >
                {{ catalog.name }}
            </VTreeViewItem>
        </template>

        <div v-if="!catalog.corrupted">
            <template v-if="catalog.entityCollections.size > 0">
                <CollectionItem
                    v-for="entityCollection in entityCollections"
                    :key="entityCollection.entityType"
                    :entity-collection="entityCollection"
                    @change="emit('change')"
                />
            </template>
            <template v-else>
                <VTreeViewEmptyItem />
            </template>
        </div>

        <RenameCatalogDialog
            v-if="showRenameCatalogDialog"
            v-model="showRenameCatalogDialog"
            :connection="connection"
            :catalog-name="catalog.name"
            @rename="emit('change')"
        />
        <ReplaceCatalogDialog
            v-if="showReplaceCatalogDialog"
            v-model="showReplaceCatalogDialog"
            :connection="connection"
            :catalog-name="catalog.name"
            @replace="emit('change')"
        />
        <SwitchCatalogToAliveStateDialog
            v-if="showSwitchCatalogToAliveStateDialog"
            v-model="showSwitchCatalogToAliveStateDialog"
            :connection="connection"
            :catalog-name="catalog.name"
            @switch="emit('change')"
        />
        <DropCatalogDialog
            v-if="showDropCatalogDialog"
            v-model="showDropCatalogDialog"
            :connection="connection"
            :catalog-name="catalog.name"
            @drop="emit('change')"
        />
        <CreateCollectionDialog
            v-if="showCreateCollectionDialog"
            v-model="showCreateCollectionDialog"
            :connection="connection"
            :catalog-name="catalog.name"
            @create="emit('change')"
        />
    </VListGroup>
</template>

<style scoped></style>
