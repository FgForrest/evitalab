<script setup lang="ts">
/**
 * Explorer tree item representing a single collection in evitaDB within a catalog.
 */
import { MenuAction } from '@/modules/base/model/menu/MenuAction'
import { useWorkspaceService, WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import {
    EntityViewerTabFactory,
    useEntityViewerTabFactory
} from '@/modules/entity-viewer/viewer/workspace/service/EntityViewerTabFactory'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import VTreeViewItem from '@/modules/base/component/VTreeViewItem.vue'
import { computed, Ref, ref, watch } from 'vue'
import { MenuItem } from '@/modules/base/model/menu/MenuItem'
import DeleteCollectionDialog from '@/modules/connection-explorer/component/DeleteCollectionDialog.vue'
import RenameCollectionDialog from '@/modules/connection-explorer/component/RenameCollectionDialog.vue'
import { EntityCollectionStatistics } from '@/modules/database-driver/request-response/EntityCollectionStatistics'
import { ServerStatus } from '@/modules/database-driver/request-response/status/ServerStatus'
import { useCatalog, useServerStatus } from '@/modules/connection-explorer/component/dependecies'
import { CollectionMenuItemType } from '@/modules/connection-explorer/model/CollectionMenuItemType'
import {
    CollectionItemMenuFactory,
    useCollectionItemMenuFactory
} from '@/modules/connection-explorer/service/CollectionItemMenuFactory'

const workspaceService: WorkspaceService = useWorkspaceService()
const entityViewerTabFactory: EntityViewerTabFactory = useEntityViewerTabFactory()
const collectionItemMenuFactory: CollectionItemMenuFactory = useCollectionItemMenuFactory()

const props = defineProps<{
    entityCollection: EntityCollectionStatistics
}>()
const serverStatus: Ref<ServerStatus | undefined> = useServerStatus()

const showDeleteCollectionDialog = ref<boolean>(false)
const showRenameCollectionDialog = ref<boolean>(false)

const catalog = useCatalog()
const menuItems = ref<Map<CollectionMenuItemType, MenuItem<CollectionMenuItemType>>>()
const menuItemList = computed<MenuItem<CollectionMenuItemType>[]>(() => {
    if (menuItems.value == undefined) {
        return []
    }
    return Array.from(menuItems.value.values())
})
watch(
    [serverStatus, catalog, () => props.entityCollection],
    async () => menuItems.value = await createMenuItems(),
    { immediate: true }
)

if (catalog.value == undefined) {
    throw new UnexpectedError(
        `Catalog is not loaded yet, but collection item is already rendered!`
    )
}

function openEntityViewer() {
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
    const item: MenuItem<CollectionMenuItemType> | undefined = menuItems.value?.get(action as CollectionMenuItemType)
    if (item instanceof MenuAction) {
        item.execute()
    }
}

async function createMenuItems(): Promise<Map<CollectionMenuItemType, MenuItem<CollectionMenuItemType>>> {
    return await collectionItemMenuFactory.createItems(
        serverStatus.value,
        catalog.value,
        props.entityCollection,
        () => showRenameCollectionDialog.value = true,
        () => showDeleteCollectionDialog.value = true
    )
}
</script>

<template>
    <div>
        <VTreeViewItem
            prepend-icon="mdi-list-box-outline"
            :actions="menuItemList"
            @click="openEntityViewer"
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
