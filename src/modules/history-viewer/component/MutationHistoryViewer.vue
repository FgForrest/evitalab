<script setup lang="ts">

import VTabToolbar from '@/modules/base/component/VTabToolbar.vue'
import type { TabComponentProps } from '@/modules/workspace/tab/model/TabComponentProps'
import type { TabComponentEvents } from '@/modules/workspace/tab/model/TabComponentEvents'
import type { TabComponentExpose } from '@/modules/workspace/tab/model/TabComponentExpose'
import { SubjectPath } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPath'
import {
    ConnectionSubjectPath
} from '@/modules/connection/workspace/status-bar/model/subject-path-status/ConnectionSubjectPath'
import { SubjectPathItem } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPathItem'
import { useI18n } from 'vue-i18n'
import { computed, onBeforeMount, onMounted, onUnmounted, ref, watch } from 'vue'
import { List } from 'immutable'
import { Keymap, useKeymap } from '@/modules/keymap/service/Keymap'
import {
    MutationHistoryViewerTabDefinition
} from '@/modules/history-viewer/model/MutationHistoryViewerTabDefinition.ts'
import type { MutationHistoryViewerTabParams } from '@/modules/history-viewer/model/MutationHistoryViewerTabParams.ts'
import { MutationHistoryCriteria } from '@/modules/history-viewer/model/MutationHistoryCriteria.ts'
import MutationHistory from '@/modules/history-viewer/component/MutationHistory.vue'
import { provideHistoryCriteria } from '@/modules/history-viewer/component/dependencies.ts'
import MutationHistoryFilter from '@/modules/history-viewer/component/MutationHistoryFilter.vue'
import { Command } from '@/modules/keymap/model/Command.ts'
import ShareTabButton from '@/modules/workspace/tab/component/ShareTabButton.vue'
import { MutationHistoryViewerTabData } from '@/modules/history-viewer/model/MutationHistoryViewerTabData.ts'
import { TabType } from '@/modules/workspace/tab/model/TabType.ts'
import VActionTooltip from '@/modules/base/component/VActionTooltip.vue'
import StartPointerButton from '@/modules/history-viewer/component/StartPointerButton.vue'
import {
    CatalogSchemaConverter
} from '@/modules/database-driver/connector/grpc/service/converter/CatalogSchemaConverter.ts'
import { ContainerType } from '@/modules/database-driver/data-type/ContainerType.ts'
import { useWorkspaceService, WorkspaceService } from '@/modules/workspace/service/WorkspaceService.ts'
import { GrpcChangeCaptureContainerType } from '@/modules/database-driver/connector/grpc/gen/GrpcChangeCapture_pb.ts'

const keymap: Keymap = useKeymap()
const { t } = useI18n()

const workspaceService: WorkspaceService = useWorkspaceService()
const props = defineProps<TabComponentProps<MutationHistoryViewerTabParams, MutationHistoryViewerTabData>>()
const emit = defineEmits<TabComponentEvents>()
defineExpose<TabComponentExpose>({
    path(): SubjectPath | undefined {
        return new ConnectionSubjectPath(
            props.params.dataPointer.connection,
            [
                SubjectPathItem.plain(props.params.dataPointer.catalogName),
                SubjectPathItem.significant(
                    MutationHistoryViewerTabDefinition.icon(),
                    t('mutationHistoryViewer.title')
                )
            ]
        )
    }
})

const title: List<string> = List.of(
    props.params.dataPointer.catalogName,
    t('mutationHistoryViewer.title')
)

const shareTabButtonRef = ref<{ share(): void } | undefined>()
const historyListRef = ref<{
    moveStartPointerToNewest(): Promise<void>
    removeStartPointer(): void
    reload(): Promise<void>
} | undefined>()
const criteria = ref<MutationHistoryCriteria>(new MutationHistoryCriteria(
    props.data.from,
    props.data.to,
    props.data.entityPrimaryKey,
    props.data.operationList,
    props.data.containerNameList,
    props.data.containerTypeList,
    props.data.entityType,
    props.data.areaType ?? 'both',
    props.data.mutableFilters
))
provideHistoryCriteria(criteria)



const initialized = ref<boolean>(false)
const historyListLoading = ref<boolean>(false)
const historyStartPointerLoading = ref<boolean>(false)
const historyStartPointerActive = ref<boolean>(false)


const currentData = computed<MutationHistoryViewerTabData>(() => {
    return new MutationHistoryViewerTabData(
        criteria.value.from,
        criteria.value.to,
        criteria.value.entityPrimaryKey,
        criteria.value.operationList,
        criteria.value.containerNameList,
        criteria.value.containerTypeList,
        criteria.value.entityType,
        criteria.value.areaType ?? 'both',
        criteria.value.mutableFilters
    )
})
watch(currentData, (data) => {
    emit('update:data', data)
})

watch(
    historyListRef,
    () => {
        if (!initialized.value && historyListRef.value != undefined) {
            void reloadHistoryList()
            initialized.value = true
        }
    },
    { immediate: true }
)
onBeforeMount(() => {
    emit('ready')
})
onMounted(() => {
    // register viewer specific keyboard shortcuts
    keymap.bind(Command.MutationHistoryViewer_ShareTab, props.id, () => shareTabButtonRef.value?.share())
    keymap.bind(Command.MutationHistoryViewer_ReloadRecordHistory, props.id, () => { void reloadHistoryList() })
    keymap.bind(Command.MutationHistoryViewer_MoveStartPointer, props.id, () => { void moveStartPointerToNewest() })
})
onUnmounted(() => {
    // unregister console specific keyboard shortcuts
    keymap.unbind(Command.MutationHistoryViewer_ShareTab, props.id)
    keymap.unbind(Command.MutationHistoryViewer_ReloadRecordHistory, props.id)
    keymap.unbind(Command.MutationHistoryViewer_MoveStartPointer, props.id)
})

async function moveStartPointerToNewest(): Promise<void> {
    historyStartPointerLoading.value = true
    await historyListRef.value?.moveStartPointerToNewest()
    historyStartPointerLoading.value = false
}

function removeStartPointer(): void {
    historyStartPointerLoading.value = true
    historyListRef.value?.removeStartPointer()
    historyStartPointerLoading.value = false
}

async function reloadHistoryList(): Promise<void> {
    historyListLoading.value = true
    await historyListRef.value?.reload()
    historyListLoading.value = false
}

const titleDetails: List<string> = List.of(
    props.params.dataPointer.catalogName,
    t('mutationHistoryViewer.title'),
    `${currentData.value.entityType}: ${currentData.value.entityPrimaryKey}`,
    ...(!!currentData.value?.containerNameList?.length && CatalogSchemaConverter.toContainerTypes(currentData.value.containerTypeList).contains(ContainerType.Attribute)
        ? [t(`mutationHistoryViewer.toolbar.attributes`, {"containerNameList": currentData.value.containerNameList?.join(', ') }) ]
        : []),
    ...(CatalogSchemaConverter.toContainerTypes(currentData.value.containerTypeList).contains(ContainerType.Price)
        ? [t(`mutationHistoryViewer.toolbar.price`)]
        : []),
    ...(!!currentData.value?.containerNameList?.length && CatalogSchemaConverter.toContainerTypes(currentData.value.containerTypeList).contains(ContainerType.Reference)
        ? [t(`mutationHistoryViewer.toolbar.reference`, {"referenceName": currentData.value?.containerNameList[0]})]
        : []),
    ...(CatalogSchemaConverter.toContainerTypes(currentData.value.containerTypeList).contains(ContainerType.AssociatedData)
        ? [t(`mutationHistoryViewer.toolbar.associatedData`)]
        : []),
    t('mutationHistoryViewer.toolbar.history')
)

const openMutationHistoryByAttribute = () => {
    const entityPrimaryKey = props.data.entityPrimaryKey


    workspaceService.createTab(
        workspaceService.mutationHistoryViewerTabFactory.createNew(
            props.params.dataPointer.catalogName,
            new MutationHistoryViewerTabData(
                undefined,
                undefined,
                entityPrimaryKey,
                undefined,
                undefined,
                [GrpcChangeCaptureContainerType.CONTAINER_ENTITY],
                props.data.entityType,
                'dataSite',
                false
            )
        )
    )
}


</script>

<template>
    <div class="mutation-history-viewer">
        <VTabToolbar
            v-if="criteria.mutableFilters"
            :prepend-icon="MutationHistoryViewerTabDefinition.icon()"
            :title="title"
            :extension-height="64"
        >
            <template #append>
                <ShareTabButton
                    ref="shareTabButtonRef"
                    :tab-type="TabType.MutationHistoryViewer"
                    :tab-params="params"
                    :tab-data="currentData"
                    :command="Command.MutationHistoryViewer_ShareTab"
                />

                <StartPointerButton
                    :active="historyStartPointerActive"
                    :loading="historyStartPointerLoading"
                    @move-start-pointer-to-newest="moveStartPointerToNewest"
                    @remove-start-pointer="removeStartPointer"
                />

                <VBtn icon density="compact" :loading="historyListLoading" @click="reloadHistoryList">
                    <!--            todo lho new data indicator-->
                    <VIcon>mdi-refresh</VIcon>
                    <VActionTooltip activator="parent" :command="Command.MutationHistoryViewer_ReloadRecordHistory">
                        {{ t('mutationHistoryViewer.button.reloadMutationHistory') }}
                    </VActionTooltip>
                </VBtn>
            </template>

            <template #extension>
                <MutationHistoryFilter
                    v-model="criteria"
                    :data-pointer="params.dataPointer"
                    @apply="reloadHistoryList"
                />
            </template>
        </VTabToolbar>
<!--        todo pfi: fix height of the toolbar -->
        <VTabToolbar
            v-else
            :prepend-icon="MutationHistoryViewerTabDefinition.icon()"
            :title=titleDetails
        >
            <template #append>
                <VBtn icon density="compact" v-if="data.containerTypeList?.some(i => i !== GrpcChangeCaptureContainerType.CONTAINER_ENTITY) && !data.mutableFilters" @click="openMutationHistoryByAttribute">
                    <VIcon>mdi-table</VIcon>
                    <VActionTooltip activator="parent" >
                        {{JSON.stringify(data)}}
                        {{ t('mutationHistoryViewer.toolbar.entity') }}
                    </VActionTooltip>
                </VBtn>
            </template>
        </VTabToolbar>


        <VSheet class="mutation-history-viewer__body">
            <MutationHistory
                ref="historyListRef"
                :data-pointer="params.dataPointer"
                :criteria="criteria"
                @update:start-pointer-active="historyStartPointerActive = $event"
            />
        </VSheet>
    </div>
</template>

<style lang="scss" scoped>
.mutation-history-viewer {
    display: grid;
    grid-template-rows: 6.5rem 1fr;

    &__body {
        position: absolute;
        left: 0;
        right: 0;
        top: 6.5rem;
        bottom: 0;
        overflow-y: auto;
        padding: 0 1rem;
    }
}
</style>
