<script setup lang="ts">
import VFormDialog from '@/modules/base/component/VFormDialog.vue'
import { useI18n } from 'vue-i18n'
import { BackupViewerService, useBackupViewerService } from '@/modules/backup-viewer/service/BackupViewerService.ts'
import { type Toaster, useToaster } from '@/modules/notification/service/Toaster.ts'
import { computed, ref } from 'vue'

const props = defineProps<{
    catalogName: string,
    modelValue: boolean,
    availableCatalogs: string[]
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void,
    (e: 'backup'): void
}>()

const catalogNameValue = ref<string | undefined>(props.catalogName)

const { t } = useI18n()
const backupViewerService: BackupViewerService = useBackupViewerService()
const toaster: Toaster = useToaster()
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

async function backup(): Promise<boolean> {
    try {
        await backupViewerService.backupCatalog(
            catalogNameValue.value!,
            undefined,
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

function reset(): void {
    catalogNameValue.value = undefined
    includeWal.value = false
}
</script>

<template>
    <VFormDialog :model-value="modelValue"
                 :reset="reset"
                 :confirm="backup"
                 :changed="changed"
                 confirm-button-icon="mdi-cloud-download-outline"
                 @update:model-value="emit('update:modelValue', $event)"
    >
        <template #activator="{ props }">
            <slot name="activator" v-bind="{ props }"></slot>
        </template>
        <template #title>
            {{ t('backupViewer.backup.snapshot.title') }}
        </template>
        <template #default>
            <p class="description">{{ t('backupViewer.backup.snapshot.description') }}</p>
            <VAutocomplete v-model="catalogNameValue"
                           :label="t('backupViewer.backup.form.catalogName.label')"
                           :items="availableCatalogs"
                           :rules="catalogNameRules"
                           :disabled="!availableCatalogs"
                           required />
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

<style scoped lang="scss">
.description {
    margin-bottom: 10px;
}
</style>
