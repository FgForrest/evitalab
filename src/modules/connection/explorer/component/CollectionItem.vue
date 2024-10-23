<script setup lang="ts">
/**
 * Explorer tree item representing a single collection in evitaDB within a catalog.
 */
import { useI18n } from 'vue-i18n'
import { CollectionActionType } from '@/modules/connection/explorer/model/CollectionActionType'
import { MenuAction } from '@/modules/base/model/menu/MenuAction'
import { useWorkspaceService, WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import { Connection } from '@/modules/connection/model/Connection'
import {
    SchemaViewerTabFactory,
    useSchemaViewerTabFactory
} from '@/modules/schema-viewer/viewer/workspace/service/SchemaViewerTabFactory'
import { EntitySchemaPointer } from '@/modules/schema-viewer/viewer/model/EntitySchemaPointer'
import {
    EntityViewerTabFactory,
    useEntityViewerTabFactory
} from '@/modules/entity-viewer/viewer/workspace/service/EntityViewerTabFactory'
import { useCatalog, useConnection, useServerStatus } from '@/modules/connection/explorer/component/dependecies'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import VTreeViewItem from '@/modules/base/component/VTreeViewItem.vue'
import { EntityCollection } from '../../model/EntityCollection'
import { computed, Ref, ref } from 'vue'
import { MenuSubheader } from '@/modules/base/model/menu/MenuSubheader'
import { MenuItem } from '@/modules/base/model/menu/MenuItem'
import DropCollectionDialog from '@/modules/connection/explorer/component/DropCollectionDialog.vue'
import RenameCollectionDialog from '@/modules/connection/explorer/component/RenameCollectionDialog.vue'
import { ServerStatus } from '@/modules/connection/model/status/ServerStatus'

const workspaceService: WorkspaceService = useWorkspaceService()
const entityViewerTabFactory: EntityViewerTabFactory = useEntityViewerTabFactory()
const schemaViewerTabFactory: SchemaViewerTabFactory = useSchemaViewerTabFactory()
const { t } = useI18n()

const props = defineProps<{
    entityCollection: EntityCollection
}>()
const emit = defineEmits<{
    (e: 'change'): void
}>()
const serverStatus: Ref<ServerStatus | undefined> = useServerStatus()

const showDropCollectionDialog = ref<boolean>(false)
const showRenameCollectionDialog = ref<boolean>(false)

const connection: Connection = useConnection()
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
            connection as Connection,
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
            'mdi-table',
            openDataGrid
        )
    )
    actions.set(
        CollectionActionType.ViewSchema,
        createMenuAction(
            CollectionActionType.ViewSchema,
            'mdi-file-code-outline',
            () =>
                workspaceService.createTab(
                    schemaViewerTabFactory.createNew(
                        connection,
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
        CollectionActionType.DropCollection,
        createMenuAction(
            CollectionActionType.DropCollection,
            'mdi-delete-outline',
            () => showDropCollectionDialog.value = true,
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
            :connection="connection"
            :catalog-name="catalog.name"
            :entity-type="entityCollection.entityType"
            @rename="emit('change')"
        />
        <DropCollectionDialog
            v-if="showDropCollectionDialog"
            v-model="showDropCollectionDialog"
            :connection="connection"
            :catalog-name="catalog.name"
            :entity-type="entityCollection.entityType"
            @drop="emit('change')"
        />
    </div>
</template>

<style lang="scss" scoped></style>
