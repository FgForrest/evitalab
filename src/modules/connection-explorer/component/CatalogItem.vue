<script setup lang="ts">
/**
 * Explorer tree item representing a single catalog in evitaDB.
 */

import { computed, ref, watch } from 'vue'
import type { Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { MenuAction } from '@/modules/base/model/menu/MenuAction'
import VTreeViewItem from '@/modules/base/component/VTreeViewItem.vue'
import VTreeViewEmptyItem from '@/modules/base/component/VTreeViewEmptyItem.vue'
import CollectionItem from '@/modules/connection-explorer/component/CollectionItem.vue'
import type { MenuItem } from '@/modules/base/model/menu/MenuItem'
import RenameCatalogDialog from '@/modules/connection-explorer/component/RenameCatalogDialog.vue'
import DeleteCatalogDialog from '@/modules/connection-explorer/component/DeleteCatalogDialog.vue'
import ReplaceCatalogDialog from '@/modules/connection-explorer/component/ReplaceCatalogDialog.vue'
import CreateCollectionDialog from '@/modules/connection-explorer/component/CreateCollectionDialog.vue'
import SwitchCatalogToAliveStateDialog
    from '@/modules/connection-explorer/component/SwitchCatalogToAliveStateDialog.vue'
import { ItemFlag } from '@/modules/base/model/tree-view/ItemFlag'
import { List as ImmutableList } from 'immutable'
import { useToaster } from '@/modules/notification/service/Toaster'
import type { Toaster } from '@/modules/notification/service/Toaster'
import { CatalogStatistics } from '@/modules/database-driver/request-response/CatalogStatistics'
import { ServerStatus } from '@/modules/database-driver/request-response/status/ServerStatus'
import { provideCatalog, useServerStatus } from '@/modules/connection-explorer/component/dependecies'
import { CatalogMenuItemType } from '@/modules/connection-explorer/model/CatalogMenuItemType'
import { EntityCollectionStatistics } from '@/modules/database-driver/request-response/EntityCollectionStatistics'
import { CatalogItemService, useCatalogItemService } from '@/modules/connection-explorer/service/CatalogItemService'
import {
    CatalogItemMenuFactory,
    useCatalogItemMenuFactory
} from '@/modules/connection-explorer/service/CatalogItemMenuFactory'
import {
    type BackupViewerTabFactory,
    useBackupsTabFactory
} from '@/modules/backup-viewer/service/BackupViewerTabFactory.ts'
import { useWorkspaceService, WorkspaceService } from '@/modules/workspace/service/WorkspaceService.ts'
import BackupSelector from '@/modules/backup-viewer/components/BackupSelector.vue'
import DuplicateCatalogDialog from '@/modules/connection-explorer/component/DuplicateCatalogDialog.vue'
import type { MutationProgressType } from '@/modules/connection-explorer/model/MutationProgressType.ts'
import type {
    ApplyMutationWithProgressResponse
} from '@/modules/database-driver/request-response/schema/ApplyMutationWithProgressResponse.ts'

const catalogItemService: CatalogItemService = useCatalogItemService()
const catalogItemMenuFactory: CatalogItemMenuFactory = useCatalogItemMenuFactory()
const backupViewerTabFactory: BackupViewerTabFactory = useBackupsTabFactory()
const workspaceService: WorkspaceService = useWorkspaceService()
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
const showBackupCatalogDialog = ref<boolean>(false)
const showDuplicationCatalogDialog = ref<boolean>(false)

const runningProgresses = ref<Map<MutationProgressType, number>>(new Map<MutationProgressType, number>())

const flags = ref<ItemFlag[]>([])

onMounted(changeFlags)

function changeFlags() {
    flags.value = []

    if (props.catalog.corrupted) {
        flags.value.push(ItemFlag.error(t('explorer.catalog.flag.corrupted')))
    }
    if (props.catalog.isInWarmup) {
        flags.value.push(ItemFlag.warning(t('explorer.catalog.flag.warmingUp')))
    }

    for(const runningProgress of runningProgresses.value) {
        flags.value.push(ItemFlag.info(t(`explorer.catalog.flag.${runningProgress[0]}`, [runningProgress[1]])))
    }
}

const menuItems = ref<Map<CatalogMenuItemType, MenuItem<CatalogMenuItemType>>>()
watch(
    [serverStatus, () => props.catalog],
    async () => menuItems.value = await createMenuItems(),
    { immediate: true }
)
const menuItemList = computed<MenuItem<CatalogMenuItemType>[]>(() => {
    if (menuItems.value == undefined) {
        return []
    }
    return Array.from(menuItems.value.values())
})

const entityCollections = computed<ImmutableList<EntityCollectionStatistics>>(() => {
    return ImmutableList<EntityCollectionStatistics>(props.catalog.entityCollectionStatistics)
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
    const foundedAction = menuItems.value?.get(action as CatalogMenuItemType)
    if (foundedAction && foundedAction instanceof MenuAction) {
        (foundedAction as MenuAction<CatalogMenuItemType>).execute()
    }
}

async function createMenuItems(): Promise<Map<CatalogMenuItemType, MenuItem<CatalogMenuItemType>>> {
    return await catalogItemMenuFactory.createItems(
        serverStatus.value,
        props.catalog,
        () => closeSharedSession().then(),
        () => showRenameCatalogDialog.value = true,
        () => showDuplicationCatalogDialog.value = true,
        () => showReplaceCatalogDialog.value = true,
        () => showSwitchCatalogToAliveStateDialog.value = true,
        () => showDeleteCatalogDialog.value = true,
        () => showCreateCollectionDialog.value = true,
        () => showBackupCatalogDialog.value = true
    )
}

function mutationExecuted(process: AsyncIterable<ApplyMutationWithProgressResponse>, progressType: MutationProgressType) {
    runningProgresses.value.set(progressType, 0)

    handleProgress(process, progressType).then()
    changeFlags()
}

async function handleProgress(process: AsyncIterable<ApplyMutationWithProgressResponse>, progressType: MutationProgressType): Promise<void> {
    for await (const progress of process) {
        if(progress.progressInPercent !== 100)
            runningProgresses.value.set(progressType, progress.progressInPercent)
        else
            runningProgresses.value.delete(progressType)

        changeFlags()
    }
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
                :actions="menuItemList"
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

        <BackupSelector
            :model-value="showBackupCatalogDialog"
            :catalog-name="catalog.name"
            @update:model-value="value => showBackupCatalogDialog = value"
            @backup="() => {
                showBackupCatalogDialog = false
                workspaceService.createTab(
                    backupViewerTabFactory.createNew()
                )
            }"
        />
        <RenameCatalogDialog
            v-if="showRenameCatalogDialog"
            v-model="showRenameCatalogDialog"
            :catalog-name="catalog.name"
        />
        <DuplicateCatalogDialog
            v-if="showDuplicationCatalogDialog"
            v-model="showDuplicationCatalogDialog"
            :catalog-name="catalog.name"
            @mutation-executed="mutationExecuted"
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
