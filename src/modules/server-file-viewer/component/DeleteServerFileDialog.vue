<script setup lang="ts">

import VFormDialog from '@/modules/base/component/VFormDialog.vue'
import { ServerFile } from '@/modules/connection/model/server-file/ServerFile'
import { useI18n } from 'vue-i18n'
import { Connection } from '@/modules/connection/model/Connection'
import { Toaster, useToaster } from '@/modules/notification/service/Toaster'
import {
    ServerFileViewerService,
    useServerFileViewerService
} from '@/modules/server-file-viewer/service/ServerFileViewerService'

const serverFileViewerService: ServerFileViewerService = useServerFileViewerService()
const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<{
    modelValue: boolean,
    connection: Connection
    file: ServerFile
}>()
const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (e: 'delete'): void
}>()

async function deleteFile(): Promise<boolean> {
    try {
        const deleted: boolean = await serverFileViewerService.deleteFile(
            props.connection,
            props.file.fileId
        )
        if (deleted) {
            await toaster.success(t(
                'serverFileViewer.delete.notification.fileDeleted',
                { fileName: props.file.name }
            ))
        } else {
            await toaster.info(t(
                'serverFileViewer.delete.notification.fileNotDeleted',
                { fileName: props.file.name }
            ))
        }
        emit('delete')
        return true
    } catch (e: any) {
        await toaster.error(t(
            'serverFileViewer.delete.notification.couldNotDeleteFile',
            {
                fileName: props.file.name,
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
        dangerous
        changed
        confirm-button-icon="mdi-delete-outline"
        :confirm="deleteFile"
        @update:model-value="emit('update:modelValue', $event)"
    >
        <template #activator="{ props }">
            <slot name="activator" v-bind="{ props }"/>
        </template>

        <template #title>
            <I18nT keypath="serverFileViewer.delete.title">
                <template #fileName>
                    {{ file.name }}
                </template>
            </I18nT>
        </template>

        <template #prepend-form>
            {{ t('serverFileViewer.delete.question') }}
        </template>

        <template #confirm-button-body>
            {{ t('common.button.delete') }}
        </template>
    </VFormDialog>
</template>

<style lang="scss" scoped>

</style>
