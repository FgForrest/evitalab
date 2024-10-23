<script setup lang="ts">

import { TaskState } from '@/modules/connection/model/task/TaskState'
import { computed } from 'vue'
import { TaskTrait } from '@/modules/connection/model/task/TaskTrait'
import { TaskStatus } from '@/modules/connection/model/task/TaskStatus'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
    task: TaskStatus
}>()

const indeterminateLoading = computed<boolean>(() => {
    if (props.task.state !== TaskState.Running) {
        return false
    }
    return !props.task.traits.contains(TaskTrait.CanBeCancelled) ||
        props.task.traits.contains(TaskTrait.NeedsToBeStopped)
})
</script>

<template>
    <VTooltip>
        <template #activator="{ props }">
            <VProgressLinear
                v-if="task.state === TaskState.Running"
                :indeterminate="indeterminateLoading"
                :model-value="task.progress"
                class="task-progress"
                v-bind="props"
            />
        </template>
        <template #default>
            <template v-if="indeterminateLoading">
                {{ t('taskViewer.tasksVisualizer.task.progress.indeterminate') }}
            </template>
            <template v-else>
                {{ task.progress }}&nbsp;%
            </template>
        </template>
    </VTooltip>
</template>

<style lang="scss" scoped>
.task-progress {
    width: 10rem;
}
</style>
