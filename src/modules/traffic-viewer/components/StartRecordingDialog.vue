<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Connection } from '@/modules/connection/model/Connection'
import { computed, ref, watch } from 'vue'
import { Toaster, useToaster } from '@/modules/notification/service/Toaster'
import VFormDialog from '@/modules/base/component/VFormDialog.vue'
import { TrafficViewerService, useTrafficViewerService } from '@/modules/traffic-viewer/service/TrafficViewerService'
import { TaskStatus } from '@/modules/connection/model/task/TaskStatus'
import Immutable from 'immutable'
import { Catalog } from '@/modules/connection/model/Catalog'
import {
    int64MaxValue,
    parseHumanByteSizeToBigInt
} from '@/utils/number'
import { parseHumanDurationToMs } from '@/utils/duration'

const trafficViewerService: TrafficViewerService = useTrafficViewerService()
const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<{
    modelValue: boolean,
    connection: Connection
}>()
const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void,
    (e: 'start', value: TaskStatus): void
}>()

watch(
    () => props.modelValue,
    (newValue) => {
        if (newValue) {
            loadAvailableCatalogs().then()
        }
    }
)

const availableCatalogs = ref<string[]>([])
const availableCatalogsLoaded = ref<boolean>(false)

const formDialog = ref<InstanceType<typeof VFormDialog> | null>()
const catalogName = ref<string | undefined>(undefined)
const samplingRate = ref<string>('100')
const maxDurationInMilliseconds = ref<string | undefined>(undefined)
const exportFile = ref<boolean>(false)
watch(
    exportFile,
    async () => {
        //@ts-ignore
        await formDialog.value.validateForm()
    }
)
const maxFileSizeInBytes = ref<string | undefined>(undefined)
const maxFileSizeInBytesRounded = computed<boolean>(() => {
    if (maxFileSizeInBytes.value == undefined || maxFileSizeInBytes.value.trim().length === 0) {
        return false
    }
    try {
        return parseHumanByteSizeToBigInt(maxFileSizeInBytes.value)[1]
    } catch (e) {
        return false
    }
})
const chunkFileSizeInBytes = ref<string | undefined>(undefined)
const chunkFileSizeInBytesRounded = computed<boolean>(() => {
    if (chunkFileSizeInBytes.value == undefined || chunkFileSizeInBytes.value.trim().length === 0) {
        return false
    }
    try {
        return parseHumanByteSizeToBigInt(chunkFileSizeInBytes.value)[1]
    } catch (e) {
        return false
    }
})

const catalogNameRules = [
    (value: string): any => {
        if (value != undefined && value.trim().length > 0) return true
        return t('trafficViewer.recordings.startRecording.form.catalogName.validations.required')
    },
    async (value: string): Promise<any> => {
        const available: boolean = await trafficViewerService.isCatalogExists(props.connection, value)
        if (available) return true
        return t('trafficViewer.recordings.startRecording.form.catalogName.validations.notExists')
    }
]
const samplingRateRules = [
    (value: string): any => {
        if (value == undefined || value === '') {
            return t('trafficViewer.recordings.startRecording.form.samplingRate.validations.required')
        }
        const number: number = Number(value)
        if (Number.isNaN(number) || !Number.isInteger(number)) {
            return t('trafficViewer.recordings.startRecording.form.samplingRate.validations.notNumber')
        }
        if (number < 1 || number > 100) {
            return t('trafficViewer.recordings.startRecording.form.samplingRate.validations.outOfRange')
        }
        return true
    }
]
const maxDurationInMillisecondsRules = [
    (value: string): any => {
        if (value == undefined || value === '') {
            return true
        }

        let duration: bigint
        try {
            duration = parseHumanDurationToMs(value.trim())
        } catch (e) {
            return t('trafficViewer.recordings.startRecording.form.maxDurationInMilliseconds.validations.notDuration')
        }
        if (duration < 0 || duration > int64MaxValue) {
            return t('trafficViewer.recordings.startRecording.form.maxDurationInMilliseconds.validations.outOfRange')
        }
        return true
    }
]
const maxFileSizeInBytesRules = [
    (value: string): any => {
        if (!exportFile.value) {
            return true
        }
        if (value == undefined || value === '') {
            return true
        }
        let number: bigint
        try {
            number = parseHumanByteSizeToBigInt(value)[0]
        } catch (e) {
            return t('trafficViewer.recordings.startRecording.form.maxFileSizeInBytes.validations.notByteSize')
        }
        if (number < 0 || number > int64MaxValue) {
            return t('trafficViewer.recordings.startRecording.form.maxFileSizeInBytes.validations.outOfRange')
        }
        return true
    }
]
const chunkFileSizeInBytesRules = [
    (value: string): any => {
        if (!exportFile.value) {
            return true
        }
        if (value == undefined || value === '') {
            return true
        }
        let number: bigint
        try {
            number = parseHumanByteSizeToBigInt(value)[0]
        } catch (e) {
            return t('trafficViewer.recordings.startRecording.form.chunkFileSizeInBytes.validations.notByteSize')
        }
        if (number < 0 || number > int64MaxValue) {
            return t('trafficViewer.recordings.startRecording.form.chunkFileSizeInBytes.validations.outOfRange')
        }
        return true
    }
]

async function loadAvailableCatalogs(): Promise<void> {
    try {
        const fetchedAvailableCatalogs: Immutable.List<Catalog> = await trafficViewerService.getAvailableCatalogs(props.connection)
        availableCatalogs.value = fetchedAvailableCatalogs
            .filter(it => !it.corrupted)
            .map(it => it.name)
            .toArray()
        availableCatalogsLoaded.value = true
    } catch (e: any) {
        toaster.error(t(
            'backupViewer.backup.notification.couldNotLoadAvailableCatalogs',
            { reason: e.message }
        ))
    }
}

function reset(): void {
    catalogName.value = undefined
    samplingRate.value = '100'
    maxDurationInMilliseconds.value = undefined
    exportFile.value = false
    maxFileSizeInBytes.value = undefined
    chunkFileSizeInBytes.value = undefined
}

async function startRecording(): Promise<boolean> {
    try {
        const createdTask: TaskStatus = await trafficViewerService.startRecording(
            props.connection,
            catalogName.value!,
            Number(samplingRate.value),
            (maxDurationInMilliseconds.value != undefined && (maxDurationInMilliseconds.value as string).trim().length > 0)
                ? parseHumanDurationToMs(maxDurationInMilliseconds.value.trim())
                : undefined,
            exportFile.value,
            (exportFile.value && maxFileSizeInBytes.value != undefined && (maxFileSizeInBytes.value as string).trim().length > 0)
                ? parseHumanByteSizeToBigInt(maxFileSizeInBytes.value.trim())[0]
                : undefined,
            (exportFile.value && chunkFileSizeInBytes.value != undefined && (chunkFileSizeInBytes.value as string).trim().length > 0)
                ? parseHumanByteSizeToBigInt(chunkFileSizeInBytes.value.trim())[0]
                : undefined
        )
        toaster.success(t('trafficViewer.recordings.startRecording.notification.recordingStarted'))
        emit('start', createdTask)
        return true
    } catch (e: any) {
        toaster.error(t(
            'trafficViewer.recordings.startRecording.notification.couldNotStartRecording',
            { reason: e.message }
        ))
        return false
    }
}
</script>

<template>
    <VFormDialog
        ref="formDialog"
        :model-value="modelValue"
        changed
        scrollable
        confirm-button-icon="mdi-record-circle-outline"
        :confirm="startRecording"
        :reset="reset"
        @update:model-value="emit('update:modelValue', $event)"
    >
        <template #activator="{ props }">
            <slot name="activator" v-bind="{ props }" />
        </template>

        <template #title>
            {{ t('trafficViewer.recordings.startRecording.title') }}
        </template>

        <template #default>
            <VAutocomplete
                v-model="catalogName"
                :label="t('trafficViewer.recordings.startRecording.form.catalogName.label')"
                :items="availableCatalogs"
                :rules="catalogNameRules"
                :disabled="!availableCatalogsLoaded"
                required
            />
            <VTextField
                v-model="samplingRate"
                :label="t('trafficViewer.recordings.startRecording.form.samplingRate.label')"
                :hint="t('trafficViewer.recordings.startRecording.form.samplingRate.hint')"
                :suffix="t('trafficViewer.recordings.startRecording.form.samplingRate.unit')"
                :rules="samplingRateRules"
            />
            <VTextField
                v-model="maxDurationInMilliseconds"
                :label="t('trafficViewer.recordings.startRecording.form.maxDurationInMilliseconds.label')"
                :hint="t('trafficViewer.recordings.startRecording.form.maxDurationInMilliseconds.hint')"
                clearable
                :rules="maxDurationInMillisecondsRules"
            />
            <VCheckbox
                v-model="exportFile"
                :label="t('trafficViewer.recordings.startRecording.form.exportFile.label')"
                :messages="t('trafficViewer.recordings.startRecording.form.exportFile.hint')"
            />
            <VTextField
                v-show="exportFile"
                v-model="maxFileSizeInBytes"
                :label="t('trafficViewer.recordings.startRecording.form.maxFileSizeInBytes.label')"
                :hint="maxFileSizeInBytesRounded ? t('trafficViewer.recordings.startRecording.form.maxFileSizeInBytes.hint.rounded') : t('trafficViewer.recordings.startRecording.form.maxFileSizeInBytes.hint.default')"
                clearable
                :suffix="t('trafficViewer.recordings.startRecording.form.maxFileSizeInBytes.unit')"
                :rules="maxFileSizeInBytesRules"
            />
            <VTextField
                v-show="exportFile"
                v-model="chunkFileSizeInBytes"
                :label="t('trafficViewer.recordings.startRecording.form.chunkFileSizeInBytes.label')"
                :hint="chunkFileSizeInBytesRounded ? t('trafficViewer.recordings.startRecording.form.chunkFileSizeInBytes.hint.rounded') : t('trafficViewer.recordings.startRecording.form.chunkFileSizeInBytes.hint.default')"
                clearable
                :suffix="t('trafficViewer.recordings.startRecording.form.chunkFileSizeInBytes.unit')"
                :rules="chunkFileSizeInBytesRules"
            />
        </template>

        <template #append-form>
            <VAlert type="info" icon="mdi-information-outline">
                {{ t('trafficViewer.recordings.startRecording.info') }}
                <template v-if="exportFile">
                    {{ t('trafficViewer.recordings.startRecording.infoForFileExport') }}
                </template>
            </VAlert>
        </template>

        <template #confirm-button-content>
            {{ t('trafficViewer.recordings.startRecording.button.startRecording') }}
        </template>
    </VFormDialog>
</template>

<style scoped lang="scss">

</style>
