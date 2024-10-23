<script setup lang="ts">

import { TaskStatus } from '@/modules/connection/model/task/TaskStatus'
import { computed } from 'vue'
import { fallbackTaskIcon, taskTypeToIconMapping } from '@/modules/task-viewer/model/taskTypeToIconMapping'

const props = defineProps<{
    task: TaskStatus
}>()

const taskIcon = computed<string>(() => {
    const icon: string | undefined = taskTypeToIconMapping.get(props.task.mainTaskType)
    if (icon != undefined) {
        return icon
    }
    return fallbackTaskIcon
})
</script>

<template>
    <VTooltip>
        <template #activator="{ props }">
            <VIcon v-bind="props">{{ taskIcon }}</VIcon>
        </template>

        <template #default>
            {{ task.mainTaskType }}
        </template>
    </VTooltip>
</template>

<style lang="scss" scoped>

</style>
