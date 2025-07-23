<script setup lang="ts">
import VFormDialog from '@/modules/base/component/VFormDialog.vue'
import { useI18n } from 'vue-i18n'
import { BackupViewerService, useBackupViewerService } from '@/modules/backup-viewer/service/BackupViewerService.ts'
import { useToaster } from '@/modules/notification/service/Toaster.ts'
import type { Toaster } from '@/modules/notification/service/Toaster.ts'

const props = defineProps<{
    catalogName: string,
    modelValue: boolean,
    availableCatalogs: string[]
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void,
    (e: 'backup'): void
}>()

const { t } = useI18n()
const backupViewerService: BackupViewerService = useBackupViewerService()
const toaster: Toaster = useToaster()
const catalogNameValue = ref<string | null>(props.catalogName)

async function backup(): Promise<boolean> {
    try {
        await backupViewerService.fullBackupCatalog(props.catalogName)

        await toaster.success(t(
            'backupViewer.backup.notification.backupRequested',
            { catalogName: props.catalogName }
        ))
        emit('backup')

        return true
    } catch (e: any) {
        return false
    }
}
</script>

<template>
    <VFormDialog :model-value="modelValue" :confirm="backup" :changed="true" @update:model-value="(e) => {  emit('update:modelValue', e)}">
        <template #activator="{ props }">
            <slot name="activator" v-bind="{ props }" />
        </template>
        <template #title>
            {{ t('backupViewer.backup.full.title') }}
        </template>
        <template #append-form>
            <VAlert type="info" icon="mdi-information-outline">
                {{ t('backupViewer.backup.info') }}
            </VAlert>
        </template>
        <template #default>
            <p class="description">
                {{ t('backupViewer.backup.full.description') }}
            </p>
            <VAutocomplete v-model="catalogNameValue"
                           :label="t('backupViewer.backup.form.catalogName.label')"
                           :items="availableCatalogs"
                           disabled
                           required
                           readonly />
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
