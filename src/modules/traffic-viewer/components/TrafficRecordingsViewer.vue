<script setup lang="ts">
import { List } from 'immutable'
import { useI18n } from 'vue-i18n'
import { ref } from 'vue'
import { TabComponentEvents } from '@/modules/workspace/tab/model/TabComponentEvents'
import { TabComponentProps } from '@/modules/workspace/tab/model/TabComponentProps'
import { VoidTabData } from '@/modules/workspace/tab/model/void/VoidTabData'
import VTabToolbar from '@/modules/base/component/VTabToolbar.vue'
import { TaskState } from '@/modules/connection/model/task/TaskState'
import TaskList from '@/modules/task-viewer/components/TaskList.vue'
import { TabComponentExpose } from '@/modules/workspace/tab/model/TabComponentExpose'
import { SubjectPath } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPath'
import {
    ConnectionSubjectPath
} from '@/modules/connection/workspace/status-bar/model/subject-path-status/ConnectionSubjectPath'
import { SubjectPathItem } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPathItem'
import { trafficRecorderTaskName } from '@/modules/traffic-viewer/model/TrafficRecorderTask'
import { TrafficRecordingsViewerTabParams } from '@/modules/traffic-viewer/model/TrafficRecordingsViewerTabParams'
import { TrafficRecordingsViewerTabDefinition } from '@/modules/traffic-viewer/model/TrafficRecordingsViewerTabDefinition'
import RecordingList from '@/modules/traffic-viewer/components/RecordingList.vue'
import StartRecordingButton from '@/modules/traffic-viewer/components/StartRecordingButton.vue'
import EndRecordingButton from '@/modules/traffic-viewer/components/EndRecordingButton.vue'

const shownTaskStates: TaskState[] = [TaskState.WaitingForPrecondition, TaskState.Running, TaskState.Queued, TaskState.Failed]
const shownTaskTypes: string[] = [trafficRecorderTaskName]

const { t } = useI18n()

const props = defineProps<TabComponentProps<TrafficRecordingsViewerTabParams, VoidTabData>>()
const emit = defineEmits<TabComponentEvents>()
defineExpose<TabComponentExpose>({
    path(): SubjectPath | undefined {
        return new ConnectionSubjectPath(
            props.params.connection,
            [SubjectPathItem.significant(
                TrafficRecordingsViewerTabDefinition.icon(),
                t('trafficViewer.recordings.title')
            )]
        )
    }
})

const taskListRef = ref<typeof TaskList>()
const recordingListRef = ref<typeof RecordingList>()

const title: List<string> = List.of(t('trafficViewer.recordings.title'))

const recordingsInPreparationPresent = ref<boolean>(false)

function reloadRecordings(): void {
    reloadTasks()
    //@ts-ignore
    recordingListRef.value?.reload(true)
}

function reloadTasks(): void {
    //@ts-ignore
    taskListRef.value?.reload(true)
}

emit('ready')
</script>

<template>
    <div class="traffic-recordings-viewer">
        <VTabToolbar :prepend-icon="TrafficRecordingsViewerTabDefinition.icon()" :title="title">
            <template #append>
                <VBtn icon @click="reloadRecordings">
                    <VIcon>mdi-refresh</VIcon>
                    <VTooltip activator="parent">
                        {{ t('trafficViewer.recordings.button.reloadRecordings') }}
                    </VTooltip>
                </VBtn>
                <StartRecordingButton
                    :connection="params.connection"
                    :disabled="recordingsInPreparationPresent"
                    @start="reloadRecordings"
                />
            </template>
        </VTabToolbar>

        <VSheet class="traffic-recordings-viewer__body">
            <TaskList
                ref="taskListRef"
                v-show="recordingsInPreparationPresent"
                :connection="params.connection"
                :subheader="t('trafficViewer.recordings.tasks.title')"
                :states="shownTaskStates"
                :task-types="shownTaskTypes"
                :page-size="5"
                hideable-pagination
                @update:active-jobs-present="recordingsInPreparationPresent = $event"
            >
                <template #item-append-action-buttons="{ task }">
                    <EndRecordingButton
                        :connection="params.connection"
                        :traffic-recorder-task="task"
                        @end="reloadRecordings"
                    />
                </template>
            </TaskList>

            <RecordingList
                ref="recordingListRef"
                :connection="params.connection"
                :recordings-in-preparation-present="recordingsInPreparationPresent"
            />
        </VSheet>
    </div>
</template>

<style lang="scss" scoped>
.traffic-recordings-viewer {
    display: grid;
    grid-template-rows: 3rem 1fr;

    &__body {
        position: absolute;
        left: 0;
        right: 0;
        top: 3rem;
        bottom: 0;
        overflow-y: auto;
    }
}
</style>
