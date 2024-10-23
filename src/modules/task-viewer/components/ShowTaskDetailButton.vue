<script setup lang="ts">

import TaskDetailDialog from '@/modules/task-viewer/components/TaskDetailDialog.vue'
import { ref } from 'vue'
import { TaskStatus } from '@/modules/connection/model/task/TaskStatus'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
    task: TaskStatus
}>()

const showDetailsDialog = ref<boolean>(false)

</script>

<template>
    <TaskDetailDialog
        v-model="showDetailsDialog"
        :task="task"
    >
        <template #activator="{ props }">
            <VBtn
                icon
                v-bind="props"
                @click="showDetailsDialog = true"
            >
                <VIcon>mdi-information-outline</VIcon>

                <VTooltip activator="parent">
                    {{ t('taskViewer.tasksVisualizer.task.button.details') }}
                </VTooltip>
            </VBtn>
        </template>
    </TaskDetailDialog>
</template>

<style lang="scss" scoped>

</style>
