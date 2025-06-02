<script setup lang="ts">

import TaskTextResultDialog from '@/modules/task-viewer/components/TaskTextResultDialog.vue'
import { ref } from 'vue'
import { TaskStatus } from '@/modules/database-driver/request-response/task/TaskStatus'
import { useI18n } from 'vue-i18n'
import { TextTaskResult } from '@/modules/database-driver/request-response/task/TextTaskResult'

const { t } = useI18n()

const props = defineProps<{
    task: TaskStatus
}>()

const showResultTextDialog = ref<boolean>(false)
</script>

<template>
    <TaskTextResultDialog
        v-model="showResultTextDialog"
        :result="task.result as TextTaskResult"
    >
        <template #activator="{ props }">
            <VBtn
                icon
                v-bind="props"
                @click="showResultTextDialog = true"
            >
                <VIcon>mdi-file-document-outline</VIcon>

                <VTooltip activator="parent">
                    {{ t('taskViewer.tasksVisualizer.task.button.textResult') }}
                </VTooltip>
            </VBtn>
        </template>
    </TaskTextResultDialog>
</template>

<style lang="scss" scoped>

</style>
