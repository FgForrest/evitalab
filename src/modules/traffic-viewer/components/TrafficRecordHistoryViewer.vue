<script setup lang="ts">

import VTabToolbar from '@/modules/base/component/VTabToolbar.vue'
import {
    TrafficRecordHistoryViewerTabDefinition
} from '@/modules/traffic-viewer/model/TrafficRecordHistoryViewerTabDefinition'
import { TabType } from '@/modules/workspace/tab/model/TabType'
import ShareTabButton from '@/modules/workspace/tab/component/ShareTabButton.vue'
import { TabComponentProps } from '@/modules/workspace/tab/model/TabComponentProps'
import { TrafficRecordHistoryViewerTabParams } from '@/modules/traffic-viewer/model/TrafficRecordHistoryViewerTabParams'
import { TrafficRecordHistoryViewerTabData } from '@/modules/traffic-viewer/model/TrafficRecordHistoryViewerTabData'
import { TabComponentEvents } from '@/modules/workspace/tab/model/TabComponentEvents'
import { TabComponentExpose } from '@/modules/workspace/tab/model/TabComponentExpose'
import { SubjectPath } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPath'
import {
    ConnectionSubjectPath
} from '@/modules/connection/workspace/status-bar/model/subject-path-status/ConnectionSubjectPath'
import { SubjectPathItem } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPathItem'
import { useI18n } from 'vue-i18n'
import { computed, onBeforeMount, onMounted, onUnmounted, ref, watch } from 'vue'
import { List } from 'immutable'
import { Command } from '@/modules/keymap/model/Command'
import { Keymap, useKeymap } from '@/modules/keymap/service/Keymap'
import RecordHistory from '@/modules/traffic-viewer/components/RecordHistory.vue'
import { TrafficRecordHistoryCriteria } from '@/modules/traffic-viewer/model/TrafficRecordHistoryCriteria'
import RecordHistoryFilter from '@/modules/traffic-viewer/components/RecordHistoryFilter.vue'
import { provideHistoryCriteria } from '@/modules/traffic-viewer/components/dependencies'
import StartPointerButton from '@/modules/traffic-viewer/components/StartPointerButton.vue'
import VActionTooltip from '@/modules/base/component/VActionTooltip.vue'

const keymap: Keymap = useKeymap()
const { t } = useI18n()

const props = defineProps<TabComponentProps<TrafficRecordHistoryViewerTabParams, TrafficRecordHistoryViewerTabData>>()
const emit = defineEmits<TabComponentEvents>()
defineExpose<TabComponentExpose>({
    path(): SubjectPath | undefined {
        return new ConnectionSubjectPath(
            props.params.dataPointer.connection,
            [
                SubjectPathItem.plain(props.params.dataPointer.catalogName),
                SubjectPathItem.significant(
                    TrafficRecordHistoryViewerTabDefinition.icon(),
                    t('trafficViewer.recordHistory.title')
                )
            ]
        )
    }
})

const title: List<string> = List.of(
    props.params.dataPointer.catalogName,
    t('trafficViewer.recordHistory.title')
)

const shareTabButtonRef = ref<InstanceType<typeof ShareTabButton> | undefined>()
const historyListRef = ref<InstanceType<typeof RecordHistory> | undefined>()
const criteria = ref<TrafficRecordHistoryCriteria>(new TrafficRecordHistoryCriteria(
    props.data.since,
    props.data.types,
    props.data.sessionId,
    props.data.longerThanInHumanFormat,
    props.data.fetchingMoreBytesThanInHumanFormat,
    props.data.labels
))
provideHistoryCriteria(criteria)

const initialized = ref<boolean>(false)
const historyListLoading = ref<boolean>(false)
const historyStartPointerLoading = ref<boolean>(false)
const historyStartPointerActive = ref<boolean>(false)

const currentData = computed<TrafficRecordHistoryViewerTabData>(() => {
    return new TrafficRecordHistoryViewerTabData(
        criteria.value.since,
        criteria.value.types,
        criteria.value.sessionId,
        criteria.value.longerThanInHumanFormat,
        criteria.value.fetchingMoreBytesThanInHumanFormat,
        criteria.value.labels
    )
})
watch(currentData, (data) => {
    emit('update:data', data)
})

watch(
    historyListRef,
    () => {
        if (!initialized.value && historyListRef.value != undefined ) {
            reloadHistoryList()
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
    keymap.bind(Command.TrafficRecordHistoryViewer_ShareTab, props.id, () => shareTabButtonRef.value?.share())
    keymap.bind(Command.TrafficRecordHistoryViewer_ReloadRecordHistory, props.id, async () => await reloadHistoryList())
    keymap.bind(Command.TrafficRecordHistoryViewer_MoveStartPointer, props.id, async () => await moveStartPointerToNewest())
})
onUnmounted(() => {
    // unregister console specific keyboard shortcuts
    keymap.unbind(Command.TrafficRecordHistoryViewer_ShareTab, props.id)
    keymap.unbind(Command.TrafficRecordHistoryViewer_ReloadRecordHistory, props.id)
    keymap.unbind(Command.TrafficRecordHistoryViewer_MoveStartPointer, props.id)
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
</script>

<template>
    <div class="traffic-recording-viewer">
        <VTabToolbar
            :prepend-icon="TrafficRecordHistoryViewerTabDefinition.icon()"
            :title="title"
            :extension-height="64"
        >
            <template #append>
                <ShareTabButton
                    ref="shareTabButtonRef"
                    :tab-type="TabType.TrafficRecordHistoryViewer"
                    :tab-params="params"
                    :tab-data="currentData"
                    :disabled="!params.dataPointer.connection.preconfigured"
                    :command="Command.TrafficRecordHistoryViewer_ShareTab"
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
                    <VActionTooltip activator="parent" :command="Command.TrafficRecordHistoryViewer_ReloadRecordHistory">
                        {{ t('trafficViewer.recordHistory.button.reloadRecordHistory') }}
                    </VActionTooltip>
                </VBtn>
            </template>

            <template #extension>
                <RecordHistoryFilter
                    v-model="criteria"
                    :data-pointer="params.dataPointer"
                    @apply="reloadHistoryList"
                />
            </template>
        </VTabToolbar>

        <VSheet class="traffic-recording-viewer__body">
            <RecordHistory
                ref="historyListRef"
                :data-pointer="params.dataPointer"
                :criteria="criteria"
                @update:start-pointer-active="historyStartPointerActive = $event"
            />
        </VSheet>
    </div>
</template>

<style lang="scss" scoped>
.traffic-recording-viewer {
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
