<script setup lang="ts">
import { errorMessage } from '@/utils/error'

import VMissingDataIndicator from '@/modules/base/component/VMissingDataIndicator.vue'
import { computed, ref, watch } from 'vue'
import { PaginatedList } from '@/modules/database-driver/request-response/PaginatedList'
import { ServerFile } from '@/modules/database-driver/request-response/server-file/ServerFile'
import { BackupViewerService, useBackupViewerService } from '@/modules/backup-viewer/service/BackupViewerService'
import { useToaster } from '@/modules/notification/service/Toaster'
import type { Toaster } from '@/modules/notification/service/Toaster'
import { useI18n } from 'vue-i18n'
import ServerFileList from '@/modules/server-file-viewer/component/ServerFileList.vue'
import RestoreBackupFileButton from '@/modules/backup-viewer/components/RestoreBackupFileButton.vue'
import { useAutoReload } from '@/modules/viewer-support/composable/useAutoReload'

const reloadInterval: number = 5000

const backupViewerService: BackupViewerService = useBackupViewerService()
const toaster: Toaster = useToaster()
const { t } = useI18n()

defineProps<{
    backupsInPreparationPresent: boolean
}>()
const emit = defineEmits<{
    (e: 'requestTaskUpdate'): void
}>()

const backupFilesLoaded = ref<boolean>(false)
const backupFiles = ref<PaginatedList<ServerFile>>()
const backupFileItems = computed<ServerFile[]>(() => {
    if (backupFiles.value == undefined) {
        return []
    }
    return backupFiles.value.data.toArray()
})
const pageNumber = ref<number>(1)
watch(pageNumber, async () => {
    await reload(true)
})
const pageCount = computed<number>(() => {
    if (backupFiles.value == undefined) {
        return 1
    }
    return Math.ceil(backupFiles.value.totalNumberOfRecords / pageSize.value)
})
const pageSize = ref<number>(20)

async function loadBackupFiles(): Promise<void> {
    backupFiles.value = await backupViewerService.getBackupFiles(
        pageNumber.value,
        pageSize.value
    )

    if (backupFiles.value.pageNumber > 1 && backupFiles.value?.data.size === 0) {
        pageNumber.value--
    }
    if (!backupFilesLoaded.value) {
        backupFilesLoaded.value = true
    }
}

const { reload } = useAutoReload(
    loadBackupFiles,
    reloadInterval,
    (e: unknown) => {
        toaster.error(t(
            'backupViewer.notification.couldNotLoadBackupFiles',
            { reason: errorMessage(e) }
        )).then()
    }
)

defineExpose<{
    reload(manual: boolean): Promise<void>
}>({
    reload
})
</script>

<template>
    <ServerFileList
        v-if="backupFilesLoaded && backupFileItems.length > 0"
        :files="backupFileItems"
        v-model:page-number="pageNumber"
        :page-size="pageSize"
        :page-count="pageCount"
        @request-task-update="emit('requestTaskUpdate')"
        @request-file-update="reload(true)"
    >
        <template v-if="backupsInPreparationPresent" #subheader>
            {{ t('backupViewer.list.title') }}
        </template>

        <template #item-append="{ file }">
            <RestoreBackupFileButton
                :backup-file="file"
                @restore="emit('requestTaskUpdate')"
            />
        </template>
    </ServerFileList>

    <VMissingDataIndicator
        v-else
        icon="mdi-cloud-download-outline"
        :title="t('backupViewer.list.noFiles')"
    />
</template>

<style lang="scss" scoped>

</style>
