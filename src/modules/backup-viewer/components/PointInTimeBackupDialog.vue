<script setup lang="ts">
import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import VFormDialog from '@/modules/base/component/VFormDialog.vue'
import { DateTime } from 'luxon'
import { BackupViewerService, useBackupViewerService } from '@/modules/backup-viewer/service/BackupViewerService'
import { useToaster } from '@/modules/notification/service/Toaster'
import type { Toaster } from '@/modules/notification/service/Toaster'
import { CatalogVersionAtResponse } from '@/modules/database-driver/request-response/CatalogVersionAtResponse'
import VDateTimeInput from '@/modules/base/component/VDateTimeInput.vue'

const backupViewerService: BackupViewerService = useBackupViewerService()
const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<{
    modelValue: boolean,
    catalogName: string,
    availableCatalogs: string[]
}>()
const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void,
    (e: 'backup'): void
}>()

const minDate = ref<DateTime | undefined>()
const minDateLoaded = ref<boolean>(false)
const maxDate = ref<DateTime | undefined>()
const maxDateLoaded = ref<boolean>(false)
const defaultTimeOffset = ref<string>()
const defaultTimeOffsetLoaded = ref<boolean>(false)

const catalogNameValue = ref<string | undefined>(props.catalogName)
watch(catalogNameValue, async () => {
    await getMinimalDate()
})

async function getMinimalDate(): Promise<void> {
    minDateLoaded.value = false
    pastMoment.value = undefined
    if (catalogNameValue.value != undefined && catalogNameValue.value.trim().length > 0) {
        await loadMinimalDate()
    } else {
        minDate.value = undefined
    }
}

const pastMoment = ref<DateTime | undefined>(undefined)
const includeWal = ref<boolean>(false)

const changed = computed<boolean>(() =>
    catalogNameValue.value != undefined && catalogNameValue.value.trim().length > 0)

const catalogNameRules = [
    (value: string): any => {
        if (value != undefined && value.trim().length > 0) return true
        return t('backupViewer.backup.form.catalogName.validations.required')
    },
    async (value: string): Promise<any> => {
        const available: boolean = await backupViewerService.isCatalogExists(value)
        if (available) return true
        return t('backupViewer.backup.form.catalogName.validations.notExists')
    }
]

async function loadMinimalDate(): Promise<void> {
    try {
        const minimalBackupDate: CatalogVersionAtResponse = await backupViewerService.getMinimalBackupDate(
            catalogNameValue.value!
        )

        minDate.value = minimalBackupDate.introducedAt.toDateTime()
        minDateLoaded.value = true

        maxDate.value = DateTime.now()
        maxDateLoaded.value = true

        defaultTimeOffset.value = minimalBackupDate.introducedAt.offset
        defaultTimeOffsetLoaded.value = true
    } catch (e: any) {
        await toaster.error(t(
            'backupViewer.backup.notification.couldNotLoadMinimalDate',
            { reason: e.message }
        ))
    }
}

function reset(): void {
    catalogNameValue.value = undefined
    pastMoment.value = undefined
    includeWal.value = false
}

async function backup(): Promise<boolean> {
    try {
        await backupViewerService.backupCatalog(
            catalogNameValue.value!,
            pastMoment.value != undefined
                ? OffsetDateTime.fromDateTime(pastMoment.value)
                : undefined,
            includeWal.value
        )
        await toaster.success(t(
            'backupViewer.backup.notification.backupRequested',
            { catalogName: catalogNameValue.value }
        ))
        emit('backup')
        return true
    } catch (e: any) {
        await toaster.error(t(
            'backupViewer.backup.notification.couldNotRequestBackup',
            {
                catalogName: catalogNameValue.value,
                reason: e.message
            }
        ))
        return false
    }
}

onMounted(async () => {
    if(props.catalogName) {
        await loadMinimalDate()
    }
})
</script>

<template>
    <VFormDialog
        :model-value="modelValue"
        :changed="changed"
        confirm-button-icon="mdi-cloud-download-outline"
        :confirm="backup"
        :reset="reset"
        @update:model-value="emit('update:modelValue', $event)"
    >
        <template #activator="{ props }">
            <slot name="activator" v-bind="{ props }"/>
        </template>

        <template #title>
            {{ t('backupViewer.backup.pointInTime.title') }}
        </template>

        <template #default>
            <p class="description">{{t('backupViewer.backup.pointInTime.description')}}</p>
            <VAutocomplete
                v-model="catalogNameValue"
                :label="t('backupViewer.backup.form.catalogName.label')"
                :items="availableCatalogs"
                :rules="catalogNameRules"
                disabled
                required
                readonly
            />
            <VDateTimeInput
                v-model="pastMoment"
                :label="t('backupViewer.backup.form.pastMoment.label')"
                :disabled="!minDateLoaded || !maxDateLoaded || !defaultTimeOffsetLoaded"
                :min="minDate"
                :max="maxDate"
                :default-time-offset="defaultTimeOffset"
            />
            <VCheckbox
                v-model="includeWal"
                :label="t('backupViewer.backup.form.includeWal.label')"
                :messages="t('backupViewer.backup.form.includeWal.description')"
            />
        </template>

        <template #append-form>
            <VAlert type="info" icon="mdi-information-outline">
                {{ t('backupViewer.backup.info') }}
            </VAlert>
        </template>

        <template #confirm-button-body>
            {{ t('backupViewer.backup.button.backup') }}
        </template>
    </VFormDialog>
</template>

<style lang="scss" scoped>
.description {
    margin-bottom: 10px;
}
</style>
