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

const { t } = useI18n()

const props = defineProps<TabComponentProps<TaskViewerTabParams, VoidTabData>>()
const emit = defineEmits<TabComponentEvents>()

const path: List<string> = List([t('taskViewer.path')])

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
        <VTabToolbar :prepend-icon="'mdi-chart-gantt'" :path="path">
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
