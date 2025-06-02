<script setup lang="ts">

import { TaskStatus } from '@/modules/database-driver/request-response/task/TaskStatus'
import { Toaster, useToaster } from '@/modules/notification/service/Toaster'
import { useI18n } from 'vue-i18n'
import { FileTaskResult } from '@/modules/database-driver/request-response/task/FileTaskResult'
import VDownloadServerFileButton from '@/modules/viewer-support/component/VDownloadServerFileButton.vue'

const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<{
    task: TaskStatus
}>()

function onCouldNotDownloadResultFile(e: Error): void {
    toaster.error(t(
        'taskViewer.tasksVisualizer.task.notification.couldNotDownloadResultFile',
        {
            taskName: props.task.taskName,
            reason: e.message
        }
    )).then()
}
</script>

<template>
    <VDownloadServerFileButton
        :file="(task.result as FileTaskResult).value"
        @error="onCouldNotDownloadResultFile($event)"
    >
        {{ t('taskViewer.tasksVisualizer.task.button.downloadFileResult') }}
    </VDownloadServerFileButton>
</template>

<style lang="scss" scoped>

</style>
