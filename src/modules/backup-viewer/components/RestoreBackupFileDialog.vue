<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { computed, ref } from 'vue'
import { ServerFile } from '@/modules/connection/model/server-file/ServerFile'
import { Connection } from '@/modules/connection/model/Connection'
import { BackupViewerService, useBackupViewerService } from '@/modules/backup-viewer/service/BackupViewerService'
import { Toaster, useToaster } from '@/modules/notification/service/Toaster'
import { ClassifierValidationErrorType } from '@/modules/connection/model/data-type/ClassifierValidationErrorType'
import VFormDialog from '@/modules/base/component/VFormDialog.vue'

const backupViewerService: BackupViewerService = useBackupViewerService()
const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<{
    modelValue: boolean,
    connection: Connection,
    backupFile: ServerFile
}>()
const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void,
    (e: 'restore'): void
}>()


const catalogNameRules = [
    (value: string): any => {
        if (value != undefined && value.trim().length > 0) return true
        return t('backupViewer.restore.form.catalogName.validations.required')
    },
    async (value: string): Promise<any> => {
        const classifierValidationResult : ClassifierValidationErrorType | undefined =
            await backupViewerService.isCatalogNameValid(props.connection, value)
        if (classifierValidationResult == undefined) return true
        return t(`backupViewer.restore.form.catalogName.validations.${classifierValidationResult}`)
    },
    async (value: string): Promise<any> => {
        const available: boolean = await backupViewerService.isCatalogNameAvailable(props.connection, value)
        if (available) return true
        return t('backupViewer.restore.form.catalogName.validations.notAvailable')
    }
]

const catalogName = ref<string>('')
const changed = computed<boolean>(() => catalogName.value != undefined && catalogName.value.length > 0)

function reset(): void {
    catalogName.value = ''
}

async function restore(): Promise<boolean> {
    try {
        await backupViewerService.restoreBackupFile(
            props.connection,
            props.backupFile.fileId,
            catalogName.value
        )
        toaster.success(t(
            'backupViewer.restore.notification.restoreRequested',
            { fileName: props.backupFile.name }
        ))
        emit('restore')
        return true
    } catch (e: any) {
        toaster.error(t(
            'backupViewer.restore.notification.couldNotRestoreBackupFile',
            {
                fileName: props.backupFile.name,
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
        confirm-button-icon="mdi-cloud-upload-outline"
        :confirm="restore"
        :reset="reset"
        @update:model-value="emit('update:modelValue', $event)"
    >
        <template #activator="{ props }">
            <slot name="activator" v-bind="{ props }" />
        </template>

        <template #title>
            <I18nT keypath="backupViewer.restore.title">
                <template #fileName>
                    <strong>{{ backupFile.name }}</strong>
                </template>
            </I18nT>
        </template>

        <template #prepend-form>
            {{ t('backupViewer.restore.description') }}
        </template>

        <template #default>
            <VTextField
                v-model="catalogName"
                :label="t('backupViewer.restore.form.catalogName.label')"
                :rules="catalogNameRules"
                required
            />
        </template>

        <template #append-form>
            <VAlert icon="mdi-information-outline" type="info">
                {{ t('backupViewer.restore.info') }}
            </VAlert>
        </template>

        <template #confirm-button-body>
            {{ t('backupViewer.restore.button.restore') }}
        </template>
    </VFormDialog>
</template>

<style scoped>

</style>
