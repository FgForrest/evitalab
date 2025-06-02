<script setup lang="ts">
/**
 * Explorer tree item representing a single collection in evitaDB within a catalog.
 */
import { useI18n } from 'vue-i18n'
import { MenuAction } from '@/modules/base/model/menu/MenuAction'
import { useWorkspaceService, WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import {
    SchemaViewerTabFactory,
    useSchemaViewerTabFactory
} from '@/modules/schema-viewer/viewer/workspace/service/SchemaViewerTabFactory'
import { EntitySchemaPointer } from '@/modules/schema-viewer/viewer/model/EntitySchemaPointer'
import {
    EntityViewerTabFactory,
    useEntityViewerTabFactory
} from '@/modules/entity-viewer/viewer/workspace/service/EntityViewerTabFactory'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import VTreeViewItem from '@/modules/base/component/VTreeViewItem.vue'
import { computed, Ref, ref } from 'vue'
import { MenuSubheader } from '@/modules/base/model/menu/MenuSubheader'
import { MenuItem } from '@/modules/base/model/menu/MenuItem'
import DeleteCollectionDialog from '@/modules/connection-explorer/component/DeleteCollectionDialog.vue'
import RenameCollectionDialog from '@/modules/connection-explorer/component/RenameCollectionDialog.vue'
import { EntityViewerTabDefinition } from '@/modules/entity-viewer/viewer/workspace/model/EntityViewerTabDefinition'
import { SchemaViewerTabDefinition } from '@/modules/schema-viewer/viewer/workspace/model/SchemaViewerTabDefinition'
import { EntityCollectionStatistics } from '@/modules/database-driver/request-response/EntityCollectionStatistics'
import { ServerStatus } from '@/modules/database-driver/request-response/status/ServerStatus'
import { useCatalog, useServerStatus } from '@/modules/connection-explorer/component/dependecies'
import { CollectionActionType } from '@/modules/connection-explorer/model/CollectionActionType'

const workspaceService: WorkspaceService = useWorkspaceService()
const entityViewerTabFactory: EntityViewerTabFactory = useEntityViewerTabFactory()
const schemaViewerTabFactory: SchemaViewerTabFactory = useSchemaViewerTabFactory()
const { t } = useI18n()

const props = defineProps<{
    entityCollection: EntityCollectionStatistics
}>()
const serverStatus: Ref<ServerStatus | undefined> = useServerStatus()

const showDeleteCollectionDialog = ref<boolean>(false)
const showRenameCollectionDialog = ref<boolean>(false)

const catalog = useCatalog()
const actions = computed<Map<CollectionActionType, MenuItem<CollectionActionType>>>(() =>
    createActions())
const actionList = computed<MenuItem<CollectionActionType>[]>(() => Array.from(
    actions.value.values()))

if (catalog.value == undefined) {
    throw new UnexpectedError(
        `Catalog schema is not loaded yet, but collection item is already rendered!`
    )
}

function openDataGrid() {
    workspaceService.createTab(
        entityViewerTabFactory.createNew(
            catalog.value.name,
            props.entityCollection.entityType,
            undefined,
            true // we want to display data to user right away, there is no malicious code here
        )
    )
}

function handleAction(action: string) {
    const item: MenuItem<CollectionActionType> | undefined = actions.value.get(action as CollectionActionType)
    if (item instanceof MenuAction) {
        item.execute()
    }
}

function createActions(): Map<CollectionActionType, MenuItem<CollectionActionType>> {
    const serverWritable: boolean = serverStatus.value != undefined && !serverStatus.value.readOnly

    const actions: Map<CollectionActionType, MenuItem<CollectionActionType>> = new Map()
    actions.set(
        CollectionActionType.ViewEntities,
        createMenuAction(
            CollectionActionType.ViewEntities,
            EntityViewerTabDefinition.icon(),
            openDataGrid
        )
    )
    actions.set(
        CollectionActionType.ViewSchema,
        createMenuAction(
            CollectionActionType.ViewSchema,
            SchemaViewerTabDefinition.icon(),
            () =>
                workspaceService.createTab(
                    schemaViewerTabFactory.createNew(
                        new EntitySchemaPointer(
                            catalog.value.name,
                            props.entityCollection.entityType
                        )
                    )
                )
        )
    )

    actions.set(
        CollectionActionType.ModifySubheader,
        new MenuSubheader(t('explorer.collection.subheader.modify'))
    )
    actions.set(
        CollectionActionType.RenameCollection,
        createMenuAction(
            CollectionActionType.RenameCollection,
            'mdi-pencil-outline',
            () => showRenameCollectionDialog.value = true,
            serverWritable
        )
    )
    actions.set(
        CollectionActionType.DeleteCollection,
        createMenuAction(
            CollectionActionType.DeleteCollection,
            'mdi-delete-outline',
            () => showDeleteCollectionDialog.value = true,
            serverWritable
        )
    )
    return actions
}

function createMenuAction(
    actionType: CollectionActionType,
    prependIcon: string,
    execute: () => void,
    enabled: boolean = true
): MenuAction<CollectionActionType> {
    return new MenuAction(
        actionType,
        t(`explorer.collection.actions.${actionType}`),
        prependIcon,
        execute,
        undefined,
        !enabled
    )
}
</script>

<template>
    <div>
        <VTreeViewItem
            prepend-icon="mdi-list-box-outline"
            :actions="actionList"
            @click="openDataGrid"
            @click:action="handleAction"
            class="text-gray-light"
        >
            {{ entityCollection.entityType }}
        </VTreeViewItem>

        <RenameCollectionDialog
            v-if="showRenameCollectionDialog"
            v-model="showRenameCollectionDialog"
            :catalog-name="catalog.name"
            :entity-type="entityCollection.entityType"
        />
        <DeleteCollectionDialog
            v-if="showDeleteCollectionDialog"
            v-model="showDeleteCollectionDialog"
            :catalog-name="catalog.name"
            :entity-type="entityCollection.entityType"
        />
    </div>
</template>

<style lang="scss" scoped></style>
