<script setup lang="ts">

import VFormDialog from '@/modules/base/component/VFormDialog.vue'
import { BackupViewerService, useBackupViewerService } from '@/modules/backup-viewer/service/BackupViewerService'
import { Connection } from '@/modules/connection/model/Connection'
import { useI18n } from 'vue-i18n'
import { computed, ref } from 'vue'
import { ClassifierValidationErrorType } from '@/modules/connection/model/data-type/ClassifierValidationErrorType'
import { Toaster, useToaster } from '@/modules/notification/service/Toaster'

const backupViewerService: BackupViewerService = useBackupViewerService()
const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<{
    modelValue: boolean
    connection: Connection
}>()
const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void,
    (e: 'restore'): void
}>()

const backupFileRules = [
    (value: File): any => {
        if (value != undefined) {
            return true
        }
        return t('backupViewer.restoreLocal.form.backupFile.validations.required')
    }
]
const catalogNameRules = [
    (value: string): any => {
        if (value != undefined && value.trim().length > 0) return true
        return t('backupViewer.restoreLocal.form.catalogName.validations.required')
    },
    async (value: string): Promise<any> => {
        const classifierValidationResult : ClassifierValidationErrorType | undefined =
            await backupViewerService.isCatalogNameValid(props.connection, value)
        if (classifierValidationResult == undefined) return true
        return t(`backupViewer.restoreLocal.form.catalogName.validations.${classifierValidationResult}`)
    },
    async (value: string): Promise<any> => {
        const available: boolean = await backupViewerService.isCatalogNameAvailable(props.connection, value)
        if (available) return true
        return t('backupViewer.restoreLocal.form.catalogName.validations.notAvailable')
    }
]

const backupFile = ref<File>()
const catalogName = ref<string>('')
const changed = computed<boolean>(() => {
    return catalogName.value != undefined &&
        catalogName.value.length > 0 &&
        backupFile.value != undefined
})

function reset(): void {
    backupFile.value = undefined
    catalogName.value = ''
}

async function restoreLocal(): Promise<boolean> {
    try {
        await backupViewerService.restoreLocalBackupFile(
            props.connection,
            backupFile.value!,
            catalogName.value
        )
        await toaster.success(t('backupViewer.restoreLocal.notification.restoreRequested'))
        emit('restore')
        return true
    } catch (e: any) {
        await toaster.error(t(
            'backupViewer.restoreLocal.notification.couldNotRestoreBackupFile',
            { reason: e.message }
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
        :confirm="restoreLocal"
        :reset="reset"
        @update:model-value="emit('update:modelValue', $event)"
    >
        <template #activator="{ props }">
            <slot name="activator" v-bind="{ props }" />
        </template>

        <template #title>
            {{ t('backupViewer.restoreLocal.title') }}
        </template>

        <template #prepend-form>
            {{ t('backupViewer.restoreLocal.description') }}
        </template>

        <template #default>
            <VFileInput
                v-model="backupFile"
                :label="t('backupViewer.restoreLocal.form.backupFile.label')"
                :rules="backupFileRules"
                required
                clearable
            />
            <VTextField
                v-model="catalogName"
                :label="t('backupViewer.restoreLocal.form.catalogName.label')"
                :rules="catalogNameRules"
                required
            />
        </template>

        <template #append-form>
            <VAlert icon="mdi-information-outline" type="info">
                {{ t('backupViewer.restoreLocal.info') }}
            </VAlert>
        </template>

        <template #confirm-button-body>
            {{ t('backupViewer.restoreLocal.button.restore') }}
        </template>
    </VFormDialog>
</template>

<style lang="scss" scoped>

</style>
