<script setup lang="ts">
import { TaskStatus } from '@/modules/connection/model/task/TaskStatus'
import { computed, onUnmounted, ref } from 'vue'
import { taskStateToColorMapping } from '@/modules/task-viewer/model/taskStateToColorMapping'
import { Duration } from 'luxon'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
    task: TaskStatus
}>()

const taskColor = computed<string | undefined>(() => {
    const color: string | undefined = taskStateToColorMapping.get(props.task.state)
    if (color != undefined && color.length > 0) {
        return color
    }
    return undefined
})

const taskDuration = ref<Duration | undefined>(props.task.duration)
let taskDurationRefreshTimeoutId: ReturnType<typeof setTimeout> | undefined = undefined
function refreshDuration(): void {
    taskDuration.value = props.task.duration
    if (props.task.finished == undefined) {
        // when task is finished we have nothing to update anymore
        taskDurationRefreshTimeoutId = setTimeout(refreshDuration, 1000)
    }
}
taskDurationRefreshTimeoutId = setTimeout(refreshDuration, 1000)

onUnmounted(() => clearTimeout(taskDurationRefreshTimeoutId))
</script>

<template>
    <span class="task-title">
        <span>{{ task.taskName }}</span>

        <!-- not using chip group because of https://github.com/vuetifyjs/vuetify/issues/19678 -->
        <span class="task-title__chips">
            <VChip :color="taskColor">
                {{ t(`taskViewer.tasksVisualizer.task.state.${task.state}`) }}
            </VChip>

            <VChip v-if="taskDuration != undefined">
                {{ taskDuration.toHuman() }}
            </VChip>
        </span>
    </span>
</template>

<style lang="scss" scoped>
.task-title {
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-flow: row wrap;
    max-height: 1.5rem;

    &__chips {
        display: flex;
        gap: 0.5rem;
        align-items: center;
    }
}
</style>
