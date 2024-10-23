<script setup lang="ts">

import TaskExceptionDialog from '@/modules/task-viewer/components/TaskExceptionDialog.vue'
import { ref } from 'vue'
import { TaskStatus } from '@/modules/connection/model/task/TaskStatus'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
    task: TaskStatus
}>()

const showExceptionDialog = ref<boolean>(false)
</script>

<template>
    <TaskExceptionDialog
        v-model="showExceptionDialog"
        :exception="task.exception || ''"
    >
        <template #activator="{ props }">
            <VBtn
                icon
                variant="text"
                color="warning"
                v-bind="props"
                @click="showExceptionDialog = true"
            >
                <VIcon>mdi-alert-outline</VIcon>

                <VTooltip activator="parent">
                    {{ t('taskViewer.tasksVisualizer.task.button.exception') }}
                </VTooltip>
            </VBtn>
        </template>
    </TaskExceptionDialog>
</template>

<style lang="scss" scoped>

</style>
