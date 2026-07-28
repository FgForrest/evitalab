<script setup lang="ts">

/**
 * Requests an on-demand export of the current traffic recording buffer of a catalog into a downloadable archive.
 * Confirming the untouched form exports with server defaults. Progress of the created task is tracked by the parent
 * ExportTrafficBufferButton.
 */

import { errorMessage } from '@/utils/error'
import { useI18n } from 'vue-i18n'
import { computed, ref } from 'vue'
import { useToaster } from '@/modules/notification/service/Toaster'
import type { Toaster } from '@/modules/notification/service/Toaster'
import VFormDialog from '@/modules/base/component/VFormDialog.vue'
import { TrafficViewerService, useTrafficViewerService } from '@/modules/traffic-viewer/service/TrafficViewerService'
import { TaskStatus } from '@/modules/database-driver/request-response/task/TaskStatus'
import { int64MaxValue, parseHumanByteSizeToBigInt } from '@/utils/number'

const trafficViewerService: TrafficViewerService = useTrafficViewerService()
const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<{
    modelValue: boolean,
    catalogName: string
}>()
const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void,
    (e: 'export', value: TaskStatus): void
}>()

const chunkFileSizeInBytes = ref<string | undefined>(undefined)
const chunkFileSizeInBytesRounded = computed<boolean>(() => {
    if (chunkFileSizeInBytes.value == undefined || chunkFileSizeInBytes.value.trim().length === 0) {
        return false
    }
    try {
        return parseHumanByteSizeToBigInt(chunkFileSizeInBytes.value)[1]
    } catch {
        return false
    }
})

const chunkFileSizeInBytesRules = [
    (value: string): boolean | string => {
        if (value == undefined || value === '') {
            return true
        }
        let number: bigint
        try {
            number = parseHumanByteSizeToBigInt(value)[0]
        } catch {
            return t('trafficViewer.recordHistory.exportDialog.form.chunkFileSizeInBytes.validations.notByteSize')
        }
        if (number < 0 || number > int64MaxValue) {
            return t('trafficViewer.recordHistory.exportDialog.form.chunkFileSizeInBytes.validations.outOfRange')
        }
        return true
    }
]

function reset(): void {
    chunkFileSizeInBytes.value = undefined
}

async function exportTrafficBuffer(): Promise<boolean> {
    try {
        const createdTask: TaskStatus = await trafficViewerService.exportTrafficBuffer(
            props.catalogName,
            (chunkFileSizeInBytes.value != undefined && chunkFileSizeInBytes.value.trim().length > 0)
                ? parseHumanByteSizeToBigInt(chunkFileSizeInBytes.value.trim())[0]
                : undefined
        )
        await toaster.info(t('trafficViewer.recordHistory.notification.exportStarted'))
        emit('export', createdTask)
        return true
    } catch (e) {
        await toaster.error(t(
            'trafficViewer.recordHistory.notification.couldNotExportBuffer',
            { reason: errorMessage(e) }
        ))
        return false
    }
}
</script>

<template>
    <VFormDialog
        :model-value="modelValue"
        changed
        confirm-button-icon="mdi-progress-download"
        :confirm="exportTrafficBuffer"
        :reset="reset"
        @update:model-value="emit('update:modelValue', $event)"
    >
        <template #activator="{ props }">
            <slot name="activator" v-bind="{ props }" />
        </template>

        <template #title>
            {{ t('trafficViewer.recordHistory.exportDialog.title') }}
        </template>

        <template #default>
            <VTextField
                v-model="chunkFileSizeInBytes"
                :label="t('trafficViewer.recordHistory.exportDialog.form.chunkFileSizeInBytes.label')"
                :hint="chunkFileSizeInBytesRounded ? t('trafficViewer.recordHistory.exportDialog.form.chunkFileSizeInBytes.hint.rounded') : t('trafficViewer.recordHistory.exportDialog.form.chunkFileSizeInBytes.hint.default')"
                clearable
                :suffix="t('trafficViewer.recordHistory.exportDialog.form.chunkFileSizeInBytes.unit')"
                :rules="chunkFileSizeInBytesRules"
            />
        </template>

        <template #append-form>
            <VAlert type="info" icon="mdi-information-outline">
                {{ t('trafficViewer.recordHistory.exportDialog.info') }}
            </VAlert>
        </template>

        <template #confirm-button-body>
            {{ t('trafficViewer.recordHistory.exportDialog.button.export') }}
        </template>
    </VFormDialog>
</template>

<style scoped lang="scss">

</style>
