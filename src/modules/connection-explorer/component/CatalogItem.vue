<script setup lang="ts">
/**
 * Explorer tree item representing a single catalog in evitaDB.
 */

import { computed, ref, Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { MenuAction } from '@/modules/base/model/menu/MenuAction'
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
import CollectionItem from '@/modules/connection-explorer/component/CollectionItem.vue'
import { MenuItem } from '@/modules/base/model/menu/MenuItem'
import { MenuSubheader } from '@/modules/base/model/menu/MenuSubheader'
import RenameCatalogDialog from '@/modules/connection-explorer/component/RenameCatalogDialog.vue'
import DeleteCatalogDialog from '@/modules/connection-explorer/component/DeleteCatalogDialog.vue'
import ReplaceCatalogDialog from '@/modules/connection-explorer/component/ReplaceCatalogDialog.vue'
import CreateCollectionDialog from '@/modules/connection-explorer/component/CreateCollectionDialog.vue'
import SwitchCatalogToAliveStateDialog
    from '@/modules/connection-explorer/component/SwitchCatalogToAliveStateDialog.vue'
import { ItemFlag } from '@/modules/base/model/tree-view/ItemFlag'
import Immutable from 'immutable'
import {
    EvitaQLConsoleTabDefinition
} from '@/modules/evitaql-console/console/workspace/model/EvitaQLConsoleTabDefinition'
import {
    GraphQLConsoleTabDefinition
} from '@/modules/graphql-console/console/workspace/model/GraphQLConsoleTabDefinition'
import { SchemaViewerTabDefinition } from '@/modules/schema-viewer/viewer/workspace/model/SchemaViewerTabDefinition'
import { Toaster, useToaster } from '@/modules/notification/service/Toaster'
import { TrafficRecordHistoryViewerTabDefinition } from '@/modules/traffic-viewer/model/TrafficRecordHistoryViewerTabDefinition'
import {
    TrafficRecordHistoryViewerTabFactory,
    useTrafficRecordHistoryViewerTabFactory
} from '@/modules/traffic-viewer/service/TrafficRecordHistoryViewerTabFactory'
import { CatalogStatistics } from '@/modules/database-driver/request-response/CatalogStatistics'
import { ServerStatus } from '@/modules/database-driver/request-response/status/ServerStatus'
import { provideCatalog, useServerStatus } from '@/modules/connection-explorer/component/dependecies'
import { CatalogActionType } from '@/modules/connection-explorer/model/CatalogActionType'
import { EntityCollectionStatistics } from '@/modules/database-driver/request-response/EntityCollectionStatistics'
import { CatalogItemService, useCatalogItemService } from '@/modules/connection-explorer/service/CatalogItemService'
import { ApiType } from '@/modules/database-driver/request-response/status/ApiType'

const workspaceService: WorkspaceService = useWorkspaceService()
const evitaQLConsoleTabFactory: EvitaQLConsoleTabFactory = useEvitaQLConsoleTabFactory()
const graphQLConsoleTabFactory: GraphQLConsoleTabFactory = useGraphQLConsoleTabFactory()
const schemaViewerTabFactory: SchemaViewerTabFactory = useSchemaViewerTabFactory()
const trafficRecordHistoryViewerTabFactory: TrafficRecordHistoryViewerTabFactory = useTrafficRecordHistoryViewerTabFactory()
const catalogItemService: CatalogItemService = useCatalogItemService()
const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<{
    catalog: CatalogStatistics
}>()
const serverStatus: Ref<ServerStatus | undefined> = useServerStatus()

const showRenameCatalogDialog = ref<boolean>(false)
const showReplaceCatalogDialog = ref<boolean>(false)
const showSwitchCatalogToAliveStateDialog = ref<boolean>(false)
const showDeleteCatalogDialog = ref<boolean>(false)
const showCreateCollectionDialog = ref<boolean>(false)

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
const actions = computed<Map<CatalogActionType, MenuItem<CatalogActionType>>>(() => createActions())
const actionList = computed<MenuItem<CatalogActionType>[]>(() => Array.from(actions.value.values()))

const entityCollections = computed<Immutable.List<EntityCollectionStatistics>>(() => {
    return Immutable.List<EntityCollectionStatistics>(props.catalog.entityCollectionStatistics)
        .sort((a: EntityCollectionStatistics, b: EntityCollectionStatistics) => {
            return a.entityType.localeCompare(b.entityType)
        })
})

const catalogRef = ref(props.catalog)
provideCatalog(catalogRef as Ref<CatalogStatistics>)

const loading = ref<boolean>(false)

async function closeSharedSession(): Promise<void> {
    try {
        await catalogItemService.closeSharedSession(props.catalog.name)
        await toaster.success(t(
            'explorer.catalog.notification.closedSharedSession',
            { catalogName: props.catalog.name }
        ))
    } catch (e: any) {
        await toaster.error(t(
            'explorer.catalog.notification.couldNotCloseSharedSession',
            {
                catalogName: props.catalog.name,
                reason: e.message
            }
        ))
    }
}

function handleAction(action: string): void {
    const foundedAction = actions.value?.get(action as CatalogActionType)
    if (foundedAction && foundedAction instanceof MenuAction) {
        (foundedAction as MenuAction<CatalogActionType>).execute()
    }
}

function createActions(): Map<CatalogActionType, MenuItem<CatalogActionType>> {
    const graphQlEnabled: boolean = serverStatus.value != undefined && serverStatus.value.apiEnabled(ApiType.GraphQL)
    const catalogNotCorrupted: boolean = !props.catalog.corrupted
    const serverWritable: boolean = serverStatus.value != undefined && !serverStatus.value.readOnly

    const actions: Map<CatalogActionType, MenuItem<CatalogActionType>> = new Map()
    actions.set(
        CatalogActionType.EvitaQLConsole,
        createMenuAction(
            CatalogActionType.EvitaQLConsole,
            EvitaQLConsoleTabDefinition.icon(),
            () => {
                workspaceService.createTab(
                    evitaQLConsoleTabFactory.createNew(
                        props.catalog.name
                    )
                )
            },
            catalogNotCorrupted
        )
    )
    actions.set(
        CatalogActionType.GraphQLDataAPIConsole,
        createMenuAction(
            CatalogActionType.GraphQLDataAPIConsole,
            GraphQLConsoleTabDefinition.icon(),
            () => {
                workspaceService.createTab(
                    graphQLConsoleTabFactory.createNew(
                        props.catalog.name,
                        GraphQLInstanceType.Data
                    )
                )
            },
            catalogNotCorrupted && graphQlEnabled
        )
    )
    actions.set(
        CatalogActionType.GraphQLSchemaAPIConsole,
        createMenuAction(
            CatalogActionType.GraphQLSchemaAPIConsole,
            GraphQLConsoleTabDefinition.icon(),
            () => {
                workspaceService.createTab(
                    graphQLConsoleTabFactory.createNew(
                        props.catalog.name,
                        GraphQLInstanceType.Schema
                    )
                )
            },
            catalogNotCorrupted && graphQlEnabled
        )
    )
    actions.set(
        CatalogActionType.ViewSchema,
        createMenuAction(
            CatalogActionType.ViewSchema,
            SchemaViewerTabDefinition.icon(),
            () => {
                workspaceService.createTab(
                    schemaViewerTabFactory.createNew(
                        new CatalogSchemaPointer(props.catalog.name)
                    )
                )
            },
            catalogNotCorrupted
        )
    )

    actions.set(
        CatalogActionType.TrafficSubheader,
        new MenuSubheader(t('explorer.catalog.subheader.traffic'))
    )
    actions.set(
        CatalogActionType.ActiveTrafficRecording,
        createMenuAction(
            CatalogActionType.ActiveTrafficRecording,
            TrafficRecordHistoryViewerTabDefinition.icon(),
            () => workspaceService.createTab(
                trafficRecordHistoryViewerTabFactory.createNew(
                    props.catalog.name
                )
            ),
            catalogNotCorrupted && serverWritable
        )
    )

    actions.set(
        CatalogActionType.ManageSubheader,
        new MenuSubheader(t('explorer.catalog.subheader.manage'))
    )
    actions.set(
        CatalogActionType.CloseSharedSession,
        createMenuAction(
            CatalogActionType.CloseSharedSession,
            'mdi-lan-disconnect',
            () => closeSharedSession().then()
        )
    )

    actions.set(
        CatalogActionType.ModifySubheader,
        new MenuSubheader(t('explorer.catalog.subheader.modify'))
    )
    actions.set(
        CatalogActionType.RenameCatalog,
        createMenuAction(
            CatalogActionType.RenameCatalog,
            'mdi-pencil-outline',
            () => showRenameCatalogDialog.value = true,
            catalogNotCorrupted && serverWritable
        )
    )
    actions.set(
        CatalogActionType.ReplaceCatalog,
        createMenuAction(
            CatalogActionType.ReplaceCatalog,
            'mdi-file-replace-outline',
            () => showReplaceCatalogDialog.value = true,
            catalogNotCorrupted && serverWritable
        )
    )
    if (props.catalog.isInWarmup) {
        actions.set(
            CatalogActionType.SwitchCatalogToAliveState,
            createMenuAction(
                CatalogActionType.SwitchCatalogToAliveState,
                'mdi-toggle-switch-outline',
                () => showSwitchCatalogToAliveStateDialog.value = true,
                catalogNotCorrupted && serverWritable
            )
        )
    }
    actions.set(
        CatalogActionType.DeleteCatalog,
        createMenuAction(
            CatalogActionType.DeleteCatalog,
            'mdi-delete-outline',
            () => showDeleteCatalogDialog.value = true,
            serverWritable
        )
    )

    actions.set(
        CatalogActionType.CollectionsSubheader,
        new MenuSubheader(t('explorer.catalog.subheader.collections'))
    )

    actions.set(
        CatalogActionType.CreateCollection,
        createMenuAction(
            CatalogActionType.CreateCollection,
            'mdi-plus',
            () => showCreateCollectionDialog.value = true,
            catalogNotCorrupted && serverWritable
        )
    )
    return new Map(actions)
}

function createMenuAction(
    actionType: CatalogActionType,
    prependIcon: string,
    execute: () => void,
    enabled: boolean = true
): MenuItem<CatalogActionType> {
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
    <VListGroup :value="catalog.name">
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
            <template v-if="catalog.entityCollectionStatistics.size > 0">
                <CollectionItem
                    v-for="entityCollection in entityCollections"
                    :key="entityCollection.entityType"
                    :entity-collection="entityCollection"
                />
            </template>
            <template v-else>
                <VTreeViewEmptyItem />
            </template>
        </div>

        <RenameCatalogDialog
            v-if="showRenameCatalogDialog"
            v-model="showRenameCatalogDialog"
            :catalog-name="catalog.name"
        />
        <ReplaceCatalogDialog
            v-if="showReplaceCatalogDialog"
            v-model="showReplaceCatalogDialog"
            :catalog-name="catalog.name"
        />
        <SwitchCatalogToAliveStateDialog
            v-if="showSwitchCatalogToAliveStateDialog"
            v-model="showSwitchCatalogToAliveStateDialog"
            :catalog-name="catalog.name"
        />
        <DeleteCatalogDialog
            v-if="showDeleteCatalogDialog"
            v-model="showDeleteCatalogDialog"
            :catalog-name="catalog.name"
        />
        <CreateCollectionDialog
            v-if="showCreateCollectionDialog"
            v-model="showCreateCollectionDialog"
            :catalog-name="catalog.name"
        />
    </VListGroup>
</template>

<style scoped></style>
