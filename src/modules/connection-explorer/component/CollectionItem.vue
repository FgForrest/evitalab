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
import { computed, ref, watch } from 'vue'
import type { Ref } from 'vue'
import type { MenuItem } from '@/modules/base/model/menu/MenuItem'
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
import { formatCountTruncated } from '@/utils/string.ts'

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
            <div class="tree-view-item-data__content">
                <span>{{ entityCollection.entityType }}</span>
                <VChip size="x-small" label class="chip ml-2" variant="plain">
                    {{ formatCountTruncated(entityCollection.totalRecords) }}
                </VChip>
            </div>
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

<style lang="scss" scoped>
.tree-view-item-data__content {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
}
.chip {
    align-self: center;
    padding: 8px;
    font-weight: bold;
}
</style>
