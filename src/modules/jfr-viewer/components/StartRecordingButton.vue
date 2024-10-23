<script setup lang="ts">

import StartRecordingDialog from '@/modules/jfr-viewer/components/StartRecordingDialog.vue'
import VTabMainActionButton from '@/modules/base/component/VTabMainActionButton.vue'
import { Connection } from '@/modules/connection/model/Connection'
import { useI18n } from 'vue-i18n'
import { ref } from 'vue'

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
    (e: 'start'): void
}>()

const showStartRecordingDialog = ref<boolean>(false)
</script>

<template>
    <StartRecordingDialog
        v-model="showStartRecordingDialog"
        :connection="connection"
        @start="emit('start')"
    >
        <template #activator="{ props }">
            <VTabMainActionButton
                prepend-icon="mdi-record-circle-outline"
                :disabled="disabled"
                @click="showStartRecordingDialog = true"
                v-bind="props"
            >
                {{ t('jfrViewer.button.startRecording') }}
            </VTabMainActionButton>
        </template>
    </StartRecordingDialog>
</template>

<style lang="scss" scoped>

</style>
