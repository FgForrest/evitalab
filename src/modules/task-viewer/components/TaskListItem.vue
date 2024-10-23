<script setup lang="ts">
/**
 * Visualizes a single server task in list of tasks
 */

import { TaskState } from '@/modules/connection/model/task/TaskState'
import { TaskStatus } from '@/modules/connection/model/task/TaskStatus'
import { Connection } from '@/modules/connection/model/Connection'
import { FileTaskResult } from '@/modules/connection/model/task/FileTaskResult'
import { TextTaskResult } from '@/modules/connection/model/task/TextTaskResult'
import CancelTaskButton from '@/modules/task-viewer/components/CancelTaskButton.vue'
import ShowTaskTextResultButton from '@/modules/task-viewer/components/ShowTaskTextResultButton.vue'
import ShowTaskExceptionButton from '@/modules/task-viewer/components/ShowTaskExceptionButton.vue'
import ShowTaskDetailButton from '@/modules/task-viewer/components/ShowTaskDetailButton.vue'
import TaskIcon from '@/modules/task-viewer/components/TaskIcon.vue'
import TaskTitle from '@/modules/task-viewer/components/TaskTitle.vue'
import TaskProgressBar from '@/modules/task-viewer/components/TaskProgressBar.vue'
import DownloadTaskFileResultButton from '@/modules/task-viewer/components/DownloadTaskFileResultButton.vue'

const props = defineProps<{
    connection: Connection
    task: TaskStatus
}>()
</script>

<template>
    <VListItem>
        <template #prepend>
            <TaskIcon :task="task" />
        </template>

        <template #title>
            <TaskTitle :task="task" />
        </template>

        <template #append>
            <div class="task-actions">
                <TaskProgressBar :task="task" />

                <div class="task-actions__buttons">
                    <ShowTaskDetailButton :task="task" />
                    <template v-if="task.state === TaskState.Running">
                        <CancelTaskButton :connection="connection" :task="task" />
                    </template>
                    <template v-else-if="task.state === TaskState.Finished">
                        <DownloadTaskFileResultButton
                            v-if="task.result instanceof FileTaskResult"
                            :connection="connection"
                            :task="task"
                        />
                        <ShowTaskTextResultButton
                            v-else-if="task.result instanceof TextTaskResult"
                            :task="task"
                        />
                    </template>
                    <template v-else-if="task.state === TaskState.Failed">
                        <ShowTaskExceptionButton :task="task" />
                    </template>

                    <slot name="append-action-buttons" :task="task" />
                </div>
            </div>
        </template>
    </VListItem>
</template>

<style lang="scss" scoped>
.task-actions {
    display: flex;
    gap: 1rem;
    align-items: center;
    margin-left: 1rem;

    &__buttons {
        display: flex;
        gap: 0.5rem;
        align-items: center;
    }
}
</style>
