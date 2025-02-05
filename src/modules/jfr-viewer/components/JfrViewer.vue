<script setup lang="ts">
import { List } from 'immutable'
import { useI18n } from 'vue-i18n'
import { ref } from 'vue'
import { TabComponentEvents } from '@/modules/workspace/tab/model/TabComponentEvents'
import { TabComponentProps } from '@/modules/workspace/tab/model/TabComponentProps'
import { VoidTabData } from '@/modules/workspace/tab/model/void/VoidTabData'
import { JfrViewerTabParams } from '@/modules/jfr-viewer/model/JfrViewerTabParams'
import VTabToolbar from '@/modules/base/component/VTabToolbar.vue'
import { TaskState } from '@/modules/connection/model/task/TaskState'
import { jfrRecorderTaskName } from '@/modules/jfr-viewer/model/JfrRecorderTask'
import TaskList from '@/modules/task-viewer/components/TaskList.vue'
import RecordingList from '@/modules/jfr-viewer/components/RecordingList.vue'
import StartRecordingButton from '@/modules/jfr-viewer/components/StartRecordingButton.vue'
import EndRecordingButton from '@/modules/jfr-viewer/components/EndRecordingButton.vue'
import { TabComponentExpose } from '@/modules/workspace/tab/model/TabComponentExpose'
import { SubjectPath } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPath'
import {
    ConnectionSubjectPath
} from '@/modules/connection/workspace/status-bar/model/subject-path-status/ConnectionSubjectPath'
import { SubjectPathItem } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPathItem'
import { JfrViewerTabDefinition } from '@/modules/jfr-viewer/model/JfrViewerTabDefinition'

const shownTaskStates: TaskState[] = [TaskState.WaitingForPrecondition, TaskState.Running, TaskState.Queued, TaskState.Failed]
const shownTaskTypes: string[] = [jfrRecorderTaskName]

const { t } = useI18n()

const props = defineProps<TabComponentProps<JfrViewerTabParams, VoidTabData>>()
const emit = defineEmits<TabComponentEvents>()
defineExpose<TabComponentExpose>({
    path(): SubjectPath | undefined {
        return new ConnectionSubjectPath(
            props.params.connection,
            [SubjectPathItem.significant(
                JfrViewerTabDefinition.icon(),
                t('jfrViewer.title')
            )]
        )
    }
})

const taskListRef = ref<typeof TaskList>()
const recordingListRef = ref<typeof RecordingList>()

const title: List<string> = List.of(t('jfrViewer.title'))

const recordingsInPreparationPresent = ref<boolean>(false)

function reloadRecordings(): void {
    reloadTasks()
    recordingListRef.value?.reload(true)
}

function reloadTasks(): void {
    taskListRef.value?.reload(true)
}

emit('ready')
</script>

<template>
    <div class="jfr-viewer">
        <VTabToolbar :prepend-icon="JfrViewerTabDefinition.icon()" :title="title">
            <template #append>
                <VBtn icon @click="reloadRecordings">
                    <VIcon>mdi-refresh</VIcon>
                    <VTooltip activator="parent">
                        {{ t('jfrViewer.button.reloadRecordings') }}
                    </VTooltip>
                </VBtn>
                <StartRecordingButton
                    :connection="params.connection"
                    :disabled="recordingsInPreparationPresent"
                    @start="reloadRecordings"
                />
            </template>
        </VTabToolbar>

        <VSheet class="jfr-viewer__body">
            <TaskList
                ref="taskListRef"
                v-show="recordingsInPreparationPresent"
                :connection="params.connection"
                :subheader="t('jfrViewer.tasks.title')"
                :states="shownTaskStates"
                :task-types="shownTaskTypes"
                :page-size="5"
                hideable-pagination
                @update:active-jobs-present="recordingsInPreparationPresent = $event"
            >
                <template #item-append-action-buttons="{ task }">
                    <EndRecordingButton
                        :connection="params.connection"
                        :jfr-recorder-task="task"
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
.jfr-viewer {
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
