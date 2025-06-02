<script setup lang="ts">

import { TaskState } from '@/modules/database-driver/request-response/task/TaskState'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { TaskStatus } from '@/modules/database-driver/request-response/task/TaskStatus'
import EndRecordingDialog from '@/modules/traffic-viewer/components/EndRecordingDialog.vue'

const { t } = useI18n()

const props = defineProps<{
    trafficRecorderTask: TaskStatus
}>()
const emit = defineEmits<{
    (e: 'end'): void
}>()

const showEndRecordingDialog = ref<boolean>(false)
const endRequested = ref<boolean>(false)

function onEnd(): void {
    endRequested.value = true
    emit('end')
}
</script>

<template>
    <EndRecordingDialog
        v-model="showEndRecordingDialog"
        :traffic-recorder-task="trafficRecorderTask"
        @end="onEnd"
    >
        <template #activator="{ props }">
            <VBtn
                v-if="trafficRecorderTask.state === TaskState.Running"
                icon
                :disabled="endRequested"
                @click="showEndRecordingDialog = true"
                v-bind="props"
            >
                <VIcon>mdi-stop-circle-outline</VIcon>
                <VTooltip activator="parent">
                    {{ t('trafficViewer.recordings.tasks.button.stopRecording') }}
                </VTooltip>
            </VBtn>
        </template>
    </EndRecordingDialog>
</template>

<style lang="scss" scoped>

</style>
