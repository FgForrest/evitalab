<script setup lang="ts">

import { computed, ref } from 'vue'
import { TaskTrait } from '@/modules/connection/model/task/TaskTrait'
import { TaskStatus } from '@/modules/connection/model/task/TaskStatus'
import { TaskViewerService, useTaskViewerService } from '@/modules/task-viewer/services/TaskViewerService'
import { Toaster, useToaster } from '@/modules/notification/service/Toaster'
import { useI18n } from 'vue-i18n'
import { Connection } from '@/modules/connection/model/Connection'

const taskViewerService: TaskViewerService = useTaskViewerService()
const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<{
    connection: Connection
    task: TaskStatus
}>()

const cancelling = ref<boolean>(false)
const canBeCancelled = computed<boolean>(() => {
    return (
            props.task.traits.contains(TaskTrait.CanBeCancelled) ||
            props.task.traits.contains(TaskTrait.NeedsToBeStopped)
        ) &&
        !props.task.isCancelRequested
})

async function cancelTask(): Promise<void> {
    cancelling.value = true
    try {
        const cancelled = await taskViewerService.cancelTask(props.connection, props.task.taskId)
        if (cancelled) {
            await toaster.success(t(
                'taskViewer.tasksVisualizer.notification.taskCancelled',
                { taskName: props.task.taskName }
            ))
        } else {
            await toaster.info(t(
                'taskViewer.tasksVisualizer.notification.taskNotCancelled',
                { taskName: props.task.taskName }
            ))
        }
        // visualize the cancel until the next full reload
        props.task.cancelRequested()
    } catch (e: any) {
        await toaster.error(t(
            'taskViewer.tasksVisualizer.notification.couldNotCancelTask',
            {
                taskName: props.task.taskName,
                reason: e.message
            }
        ))
    }
    cancelling.value = false
}
</script>

<template>
    <VBtn
        v-if="canBeCancelled"
        icon
        :loading="cancelling"
        @click="cancelTask"
    >
        <VIcon>mdi-close</VIcon>

        <VTooltip activator="parent">
            {{ t('taskViewer.tasksVisualizer.task.button.cancel') }}
        </VTooltip>
    </VBtn>
</template>

<style lang="scss" scoped>

</style>
