<script setup lang="ts">
import VFormDialog from '@/modules/base/component/VFormDialog.vue'
import { Connection } from '@/modules/connection/model/Connection'
import { JfrViewerService, useJfrViewerService } from '@/modules/jfr-viewer/service/JfrViewerService'
import { useI18n } from 'vue-i18n'
import { Toaster, useToaster } from '@/modules/notification/service/Toaster'

const jfrViewerService: JfrViewerService = useJfrViewerService()
const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<{
    modelValue: boolean,
    connection: Connection
}>()
const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void,
    (e: 'end'): void
}>()

async function stopRecording(): Promise<boolean> {
    try {
        // todo lho revise driver logic
        const stopped: boolean = await jfrViewerService.stopRecording(props.connection)
        if (stopped) {
            await toaster.success(t('jfrViewer.stopRecording.notification.recordingStopped'))
            emit('end')
        } else {
            await toaster.info(t('jfrViewer.stopRecording.notification.recordingNotStopped'))
        }
        return true
    } catch (e: any) {
        await toaster.error(t(
            'jfrViewer.stopRecording.notification.couldNotStopRecording',
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
            {{ t('jfrViewer.stopRecording.title') }}
        </template>

        <template #default>
            <VAlert type="info" icon="mdi-information-outline">
                {{ t('jfrViewer.stopRecording.info') }}
            </VAlert>
        </template>

        <template #confirm-button-body>
            {{ t('jfrViewer.stopRecording.button.stopRecording') }}
        </template>
    </VFormDialog>
</template>

<style scoped>

</style>
