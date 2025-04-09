<script setup lang="ts">

import VDownloadServerFileButton from '@/modules/connection/component/VDownloadServerFileButton.vue'
import { Connection } from '@/modules/connection/model/Connection'
import { ServerFile } from '@/modules/connection/model/server-file/ServerFile'
import { Toaster, useToaster } from '@/modules/notification/service/Toaster'
import { useI18n } from 'vue-i18n'

const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<{
    connection: Connection,
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
        :connection="connection"
        :file="file"
        @error="onCouldNotDownloadResultFile($event)"
    >
        {{ t('serverFileViewer.list.item.button.downloadFile') }}
    </VDownloadServerFileButton>
</template>

<style lang="scss" scoped>

</style>
