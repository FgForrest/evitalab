<script setup lang="ts">

import { ServerFile } from '@/modules/database-driver/request-response/server-file/ServerFile'
import { useToaster } from '@/modules/notification/service/Toaster'
import type { Toaster } from '@/modules/notification/service/Toaster'
import { useI18n } from 'vue-i18n'
import VDownloadServerFileButton from '@/modules/viewer-support/component/VDownloadServerFileButton.vue'

const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<{
    file: ServerFile
}>()

function onCouldNotDownloadResultFile(e: Error): void {
    toaster.error(t(
        'serverFileViewer.list.item.notification.couldNotDownloadFile',
        {
            fileName: props.file.name,
            reason: e.message
        }
    )).then()
}
</script>

<template>
    <VDownloadServerFileButton
        :file="file"
        @error="onCouldNotDownloadResultFile($event)"
    >
        {{ t('serverFileViewer.list.item.button.downloadFile') }}
    </VDownloadServerFileButton>
</template>

<style lang="scss" scoped>

</style>
