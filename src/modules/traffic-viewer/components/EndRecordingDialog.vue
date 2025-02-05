<script setup lang="ts">
import VFormDialog from '@/modules/base/component/VFormDialog.vue'
import { Connection } from '@/modules/connection/model/Connection'
import { useI18n } from 'vue-i18n'
import { Toaster, useToaster } from '@/modules/notification/service/Toaster'
import { TrafficViewerService, useTrafficViewerService } from '@/modules/traffic-viewer/service/TrafficViewerService'
import { TaskStatus } from '@/modules/connection/model/task/TaskStatus'

const trafficViewerService: TrafficViewerService = useTrafficViewerService()
const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<{
    modelValue: boolean,
    connection: Connection,
    trafficRecorderTask: TaskStatus
}>()
const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void,
    (e: 'end', value: TaskStatus): void
}>()

async function stopRecording(): Promise<boolean> {
    try {
        const updatedTask: TaskStatus = await trafficViewerService.stopRecording(
            props.connection,
            props.trafficRecorderTask
        )
        toaster.success(t('trafficViewer.recordings.stopRecording.notification.recordingStopped'))
        emit('end', updatedTask)
        return true
    } catch (e: any) {
        toaster.error(t(
            'trafficViewer.recordings.stopRecording.notification.couldNotStopRecording',
            { reason: e.message }
        ))
        return false
    }
}
</script>

<template>
    <VFormDialog
        :model-value="modelValue"
        changed
        confirm-button-icon="mdi-stop-circle-outline"
        :confirm="stopRecording"
        @update:model-value="emit('update:modelValue', $event)"
    >
        <template #activator="{ props }">
            <slot name="activator" :props="props" />
        </template>

        <template #title>
            {{ t('trafficViewer.recordings.stopRecording.title') }}
        </template>

        <template #default>
            <VAlert type="info" icon="mdi-information-outline">
                {{ t('trafficViewer.recordings.stopRecording.info') }}
            </VAlert>
        </template>

        <template #confirm-button-body>
            {{ t('trafficViewer.recordings.stopRecording.button.stopRecording') }}
        </template>
    </VFormDialog>
</template>

<style scoped>

</style>
