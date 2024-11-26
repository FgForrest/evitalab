<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { TabComponentProps } from '@/modules/workspace/tab/model/TabComponentProps'
import { TaskViewerTabParams } from '@/modules/task-viewer/model/TaskViewerTabParams'
import { VoidTabData } from '@/modules/workspace/tab/model/void/VoidTabData'
import { List } from 'immutable'
import { TabComponentEvents } from '@/modules/workspace/tab/model/TabComponentEvents'
import VTabToolbar from '@/modules/base/component/VTabToolbar.vue'
import TaskList from '@/modules/task-viewer/components/TaskList.vue'
import { ref } from 'vue'
import { TabComponentExpose } from '@/modules/workspace/tab/model/TabComponentExpose'
import { SubjectPath } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPath'
import {
    ConnectionSubjectPath
} from '@/modules/connection/workspace/status-bar/model/subject-path-status/ConnectionSubjectPath'
import { SubjectPathItem } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPathItem'
import { TaskViewerTabDefinition } from '@/modules/task-viewer/model/TaskViewerTabDefinition'

const { t } = useI18n()

const props = defineProps<TabComponentProps<TaskViewerTabParams, VoidTabData>>()
const emit = defineEmits<TabComponentEvents>()
defineExpose<TabComponentExpose>({
    path(): SubjectPath | undefined {
        return new ConnectionSubjectPath(
            props.params.connection,
            [SubjectPathItem.significant(
                TaskViewerTabDefinition.icon(),
                t('taskViewer.title')
            )]
        )
    }
})

const title: List<string> = List.of(t('taskViewer.title'))

const taskListRef = ref<typeof TaskList>()

const reloadingTasks = ref<boolean>(false)
function reloadTasks(): void {
    reloadingTasks.value = true
    taskListRef.value?.reload(true)
    reloadingTasks.value = false
}

emit('ready')
</script>

<template>
    <div class="task-viewer">
        <VTabToolbar :prepend-icon="TaskViewerTabDefinition.icon()" :title="title">
            <template #append>
                <VBtn icon :loading="reloadingTasks" @click="reloadTasks">
                    <VIcon>mdi-refresh</VIcon>
                    <VTooltip activator="parent">
                        {{ t('taskViewer.tasksVisualizer.button.reload') }}
                    </VTooltip>
                </VBtn>
            </template>
        </VTabToolbar>

        <VSheet class="task-viewer__body">
            <TaskList ref="taskListRef" :connection="props.params.connection" />
        </VSheet>
    </div>
</template>

<style lang="scss" scoped>
.task-viewer {
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
