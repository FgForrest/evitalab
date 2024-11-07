<script setup lang="ts">
import { OffsetDateTime } from '@/modules/connection/model/data-type/OffsetDateTime'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import VFormDialog from '@/modules/base/component/VFormDialog.vue'
import { DateTime } from 'luxon'
import { BackupViewerService, useBackupViewerService } from '@/modules/backup-viewer/service/BackupViewerService'
import { Connection } from '@/modules/connection/model/Connection'
import { Toaster, useToaster } from '@/modules/notification/service/Toaster'
import { CatalogVersionAtResponse } from '@/modules/connection/model/CatalogVersionAtResponse'
import Immutable from 'immutable'
import { Catalog } from '@/modules/connection/model/Catalog'
import VDateTimeInput from '@/modules/base/component/VDateTimeInput.vue'

const backupViewerService: BackupViewerService = useBackupViewerService()
const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<{
    modelValue: boolean,
    connection: Connection
}>()
const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void,
    (e: 'backup'): void
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
const minDate = ref<DateTime | undefined>()
const minDateLoaded = ref<boolean>(false)
const maxDate = ref<DateTime | undefined>()
const maxDateLoaded = ref<boolean>(false)
const defaultTimeOffset = ref<string>()
const defaultTimeOffsetLoaded = ref<boolean>(false)

const catalogName = ref<string | undefined>(undefined)
watch(catalogName, async () => {
    minDateLoaded.value = false
    pastMoment.value = undefined
    if (catalogName.value != undefined && catalogName.value.trim().length > 0) {
        await loadMinimalDate()
    } else {
        minDate.value = undefined
    }
})
const pastMoment = ref<DateTime | undefined>(undefined)
const includeWal = ref<boolean>(false)

const changed = computed<boolean>(() =>
    catalogName.value != undefined && catalogName.value.trim().length > 0)

const catalogNameRules = [
    (value: string): any => {
        if (value != undefined && value.trim().length > 0) return true
        return t('backupViewer.backup.form.catalogName.validations.required')
    },
    async (value: string): Promise<any> => {
        const available: boolean = await backupViewerService.isCatalogExists(props.connection, value)
        if (available) return true
        return t('backupViewer.backup.form.catalogName.validations.notExists')
    }
]

async function loadAvailableCatalogs(): Promise<void> {
    try {
        const fetchedAvailableCatalogs: Immutable.List<Catalog> = await backupViewerService.getAvailableCatalogs(props.connection)
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

async function loadMinimalDate(): Promise<void> {
    try {
        const minimalBackupDate: CatalogVersionAtResponse = await backupViewerService.getMinimalBackupDate(
            props.connection,
            catalogName.value!
        )

        minDate.value = minimalBackupDate.introducedAt.toDateTime()
        minDateLoaded.value = true

        maxDate.value = DateTime.now()
        maxDateLoaded.value = true

        defaultTimeOffset.value = minimalBackupDate.introducedAt.offset
        defaultTimeOffsetLoaded.value = true
    } catch (e: any) {
        toaster.error(t(
            'backupViewer.backup.notification.couldNotLoadMinimalDate',
            { reason: e.message }
        ))
    }
}

function reset(): void {
    catalogName.value = undefined
    pastMoment.value = undefined
    includeWal.value = false
}

async function backup(): Promise<boolean> {
    try {
        await backupViewerService.backupCatalog(
            props.connection,
            catalogName.value!,
            includeWal.value,
            pastMoment.value != undefined
                ? OffsetDateTime.fromDateTime(pastMoment.value)
                : undefined
        )
        toaster.success(t(
            'backupViewer.backup.notification.backupRequested',
            { catalogName: catalogName.value }
        ))
        emit('backup')
        return true
    } catch (e: any) {
        toaster.error(t(
            'backupViewer.backup.notification.couldNotRequestBackup',
            {
                catalogName: catalogName.value,
                reason: e.message
            }
        ))
        return false
    }
}
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
            {{ t('backupViewer.backup.title') }}
        </template>

        <template #prepend-form>
            {{ t('backupViewer.backup.description') }}
        </template>

        <template #default>
            <VAutocomplete
                v-model="catalogName"
                :label="t('backupViewer.backup.form.catalogName.label')"
                :items="availableCatalogs"
                :rules="catalogNameRules"
                :disabled="!availableCatalogsLoaded"
                required
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

<style scoped>

</style>
