<script setup lang="ts">
/**
 * Explorer tree item representing a single catalog in evitaDB.
 */

import { markRaw, ref, Ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { Catalog } from '@/modules/connection/model/Catalog'
import { Connection } from '@/modules/connection/model/Connection'
import { MenuAction } from '@/modules/base/model/menu/MenuAction'
import { CatalogActionType } from '@/modules/connection/explorer/model/CatalogActionType'
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
import { provideCatalog, useConnection } from '@/modules/connection/explorer/component/dependecies'
import { MenuItem } from '@/modules/base/model/menu/MenuItem'
import { MenuSubheader } from '@/modules/base/model/menu/MenuSubheader'
import { EvitaLabConfig, useEvitaLabConfig } from '@/modules/config/EvitaLabConfig'
import DropCatalog from '@/modules/connection/explorer/component/DropCatalog.vue'
import RenameCatalog from '@/modules/connection/explorer/component/RenameCatalog.vue'
import ReplaceCatalog from '@/modules/connection/explorer/component/ReplaceCatalog.vue'
import CreateCollection from '@/modules/connection/explorer/component/CreateCollection.vue'
import {
    RestConsoleTabFactory,
    useRestConsoleTabFactory
} from '@/modules/rest-console/console/workspace/service/RestConsoleTabFactory'

const evitaLabConfig: EvitaLabConfig = useEvitaLabConfig()
const workspaceService: WorkspaceService = useWorkspaceService()
const evitaQLConsoleTabFactory: EvitaQLConsoleTabFactory = useEvitaQLConsoleTabFactory()
const graphQLConsoleTabFactory: GraphQLConsoleTabFactory = useGraphQLConsoleTabFactory()
const restConsoleTabFactory: RestConsoleTabFactory = useRestConsoleTabFactory()
const schemaViewerTabFactory: SchemaViewerTabFactory = useSchemaViewerTabFactory()
const { t } = useI18n()
const componentVisible = ref<boolean>(false)
const PopupComponent = shallowRef(DropCatalog || RenameCatalog || CreateCollection || ReplaceCatalog)
const emits = defineEmits<{ (e: 'changed', value?: Catalog[] | undefined): void }>()

const props = defineProps<{
    catalog: Catalog
}>()

const connection: Connection = useConnection()
const actions: Map<
    CatalogActionType,
    MenuItem<CatalogActionType>
> = createActions()
const actionList: MenuItem<CatalogActionType>[] = Array.from(actions.values())

const catalogRef = ref(props.catalog)
provideCatalog(catalogRef as Ref<Catalog>)

const loading = ref<boolean>(false)

function handleAction(action: string): void {
    const foundedAction = actions.get(action as CatalogActionType)
    if (foundedAction && foundedAction instanceof MenuAction) {
        (foundedAction as MenuAction<CatalogActionType>).execute()
    }
}

function createActions(): Map<
    CatalogActionType,
    MenuItem<CatalogActionType>
> {
    const actions: Map<
        CatalogActionType,
        MenuItem<CatalogActionType>
    > = new Map()
    actions.set(
        CatalogActionType.OpenEvitaQLConsole,
        createMenuAction(
            CatalogActionType.OpenEvitaQLConsole,
            'mdi-variable',
            () => {
                workspaceService.createTab(
                    evitaQLConsoleTabFactory.createNew(
                        connection,
                        props.catalog.name
                    )
                )
            }
        )
    )
    actions.set(
        CatalogActionType.OpenGraphQLDataAPIConsole,
        createMenuAction(
            CatalogActionType.OpenGraphQLDataAPIConsole,
            'mdi-graphql',
            () => {
                workspaceService.createTab(
                    graphQLConsoleTabFactory.createNew(
                        connection,
                        props.catalog.name,
                        GraphQLInstanceType.Data
                    )
                )
            }
        )
    )
    actions.set(
        CatalogActionType.OpenGraphQLSchemaAPIConsole,
        createMenuAction(
            CatalogActionType.OpenGraphQLSchemaAPIConsole,
            'mdi-graphql',
            () => {
                workspaceService.createTab(
                    graphQLConsoleTabFactory.createNew(
                        connection,
                        props.catalog.name,
                        GraphQLInstanceType.Schema
                    )
                )
            }
        )
    )
    actions.set(
        CatalogActionType.OpenRestConsole,
        createMenuAction(
            CatalogActionType.OpenRestConsole,
            'mdi-api',
            () => {
                workspaceService.createTab(
                    restConsoleTabFactory.createNew(
                        connection,
                        props.catalog.name
                    )
                )
            }
        )
    )
    actions.set(
        CatalogActionType.ViewSchema,
        createMenuAction(
            CatalogActionType.ViewSchema,
            'mdi-file-code-outline',
            () => {
                workspaceService.createTab(
                    schemaViewerTabFactory.createNew(
                        connection,
                        new CatalogSchemaPointer(props.catalog.name)
                    )
                )
            }
        )
    )
    if (!evitaLabConfig.readOnly) {
        actions.set(
            CatalogActionType.ModifySubheader,
            new MenuSubheader(t('explorer.catalog.subheader.modify'))
        )
        actions.set(
            CatalogActionType.DropCatalog,
            createMenuAction(
                CatalogActionType.DropCatalog,
                'mdi-delete-outline',
                () => {
                    PopupComponent.value = markRaw(DropCatalog)
                    componentVisible.value = true
                }
            )
        )

        actions.set(
            CatalogActionType.RenameCatalog,
            createMenuAction(
                CatalogActionType.RenameCatalog,
                'mdi-pencil-outline',
                () => {
                    PopupComponent.value = markRaw(RenameCatalog)
                    componentVisible.value = true
                }
            )
        )

        actions.set(
            CatalogActionType.ReplaceCatalog,
            createMenuAction(
                CatalogActionType.ReplaceCatalog,
                'mdi-file-replace-outline',
                () => {
                    PopupComponent.value = markRaw(ReplaceCatalog)
                    componentVisible.value = true
                }
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
                () => {
                    PopupComponent.value = markRaw(CreateCollection)
                    componentVisible.value = true
                }
            )
        )
    }
    return new Map(actions)
}

function createMenuAction(
    actionType: CatalogActionType,
    prependIcon: string,
    execute: () => void
): MenuItem<CatalogActionType> {
    return new MenuAction(
        actionType,
        t(`explorer.catalog.actions.${actionType}`),
        prependIcon,
        execute
    )
}

function changeVisibility(visible: boolean) {
    componentVisible.value = visible
}

function confirmed(value?: Catalog[] | undefined) {
    emits('changed', value)
}
</script>

<template>
    <VListGroup :value="`${connection.name}|${catalog.name}`">
        <template #activator="{ isOpen, props }">
            <VTreeViewItem
                v-if="!catalog.corrupted"
                v-bind="props"
                openable
                :is-open="isOpen"
                prepend-icon="mdi-menu"
                :loading="loading"
                :actions="actionList"
                @click:action="handleAction"
                class="font-weight-bold"
            >
                {{ catalog.name }}
                <VTooltip activator="parent">
                    {{ catalog.name }}
                </VTooltip>
            </VTreeViewItem>

            <VTreeViewItem
                v-else
                v-bind="props"
                prepend-icon="mdi-menu"
                class="text-red"
            >
                {{ catalog.name }}
                <VTooltip activator="parent">
                    {{ t('explorer.catalog.errors.couldNotLoad') }}
                </VTooltip>
            </VTreeViewItem>
        </template>

        <div v-if="!catalog.corrupted">
            <template v-if="catalog.entityCollections.size > 0">
                <CollectionItem
                    v-for="entityCollection in catalog.entityCollections"
                    :key="entityCollection.entityType"
                    :entity-collection="entityCollection"
                    :catalog-name="catalog.name"
                    @changed="confirmed"
                />
            </template>
            <template v-else>
                <VTreeViewEmptyItem />
            </template>
        </div>
    </VListGroup>
    <PopupComponent
        v-if="componentVisible"
        :visible="true"
        :connection="connection"
        :catalog-name="catalog.name"
        @visible-changed="changeVisibility"
        @confirmed="confirmed"
    />
</template>

<style scoped></style>
