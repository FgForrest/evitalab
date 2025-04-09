<script setup lang="ts">

import { FileTaskResult } from '@/modules/connection/model/task/FileTaskResult'
import VDownloadServerFileButton from '@/modules/connection/component/VDownloadServerFileButton.vue'
import { TaskStatus } from '@/modules/connection/model/task/TaskStatus'
import { Toaster, useToaster } from '@/modules/notification/service/Toaster'
import { useI18n } from 'vue-i18n'
import { Connection } from '@/modules/connection/model/Connection'

const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<{
    connection: Connection
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
        :connection="connection"
        :file="(task.result as FileTaskResult).value"
        @error="onCouldNotDownloadResultFile($event)"
    >
        {{ t('taskViewer.tasksVisualizer.task.button.downloadFileResult') }}
    </VDownloadServerFileButton>
</template>

<style lang="scss" scoped>

</style>
