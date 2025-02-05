<script setup lang="ts">

import VTabMainActionButton from '@/modules/base/component/VTabMainActionButton.vue'
import { Connection } from '@/modules/connection/model/Connection'
import { useI18n } from 'vue-i18n'
import { ref } from 'vue'
import StartRecordingDialog from '@/modules/traffic-viewer/components/StartRecordingDialog.vue'
import { TaskStatus } from '@/modules/connection/model/task/TaskStatus'

const { t } = useI18n()

const props = withDefaults(
    defineProps<{
        connection: Connection,
        disabled?: boolean
    }>(),
    {
        disabled: false
    }
)
const emit = defineEmits<{
    (e: 'start', value: TaskStatus): void
}>()

const showStartRecordingDialog = ref<boolean>(false)
</script>

<template>
    <StartRecordingDialog
        v-model="showStartRecordingDialog"
        :connection="connection"
        @start="emit('start', $event)"
    >
        <template #activator="{ props }">
            <VTabMainActionButton
                prepend-icon="mdi-record-circle-outline"
                :disabled="disabled"
                @click="showStartRecordingDialog = true"
                v-bind="props"
            >
                {{ t('trafficViewer.recordings.button.startRecording') }}
            </VTabMainActionButton>
        </template>
    </StartRecordingDialog>
</template>

<style lang="scss" scoped>

</style>
