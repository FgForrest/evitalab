<script setup lang="ts">

import VMissingDataIndicator from '@/modules/base/component/VMissingDataIndicator.vue'
import { computed, onUnmounted, ref, watch } from 'vue'
import { PaginatedList } from '@/modules/connection/model/PaginatedList'
import { ServerFile } from '@/modules/connection/model/server-file/ServerFile'
import { BackupViewerService, useBackupViewerService } from '@/modules/backup-viewer/service/BackupViewerService'
import { Toaster, useToaster } from '@/modules/notification/service/Toaster'
import { useI18n } from 'vue-i18n'
import { Connection } from '@/modules/connection/model/Connection'
import ServerFileList from '@/modules/server-file-viewer/component/ServerFileList.vue'
import RestoreBackupFileButton from '@/modules/backup-viewer/components/RestoreBackupFileButton.vue'

const reloadInterval: number = 5000

const backupViewerService: BackupViewerService = useBackupViewerService()
const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<{
    connection: Connection
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
    await loadBackupFiles()
})
const pageCount = computed<number>(() => {
    if (backupFiles.value == undefined) {
        return 1
    }
    return Math.ceil(backupFiles.value.totalNumberOfRecords / pageSize.value)
})
const pageSize = ref<number>(20)

async function loadBackupFiles(): Promise<boolean> {
    try {
        backupFiles.value = await backupViewerService.getBackupFiles(
            props.connection,
            pageNumber.value,
            pageSize.value
        )

        if (backupFiles.value.pageNumber > 1 && backupFiles.value?.data.size === 0) {
            pageNumber.value--
        }
        if (!backupFilesLoaded.value) {
            backupFilesLoaded.value = true
        }
        return true
    } catch (e: any) {
        toaster.error(t(
            'backupViewer.notification.couldNotLoadBackupFiles',
            { reason: e.message }
        ))
        return false
    }
}

let canReload: boolean = true
let reloadTimeoutId: ReturnType<typeof setTimeout> | undefined = undefined
async function reload(manual: boolean = false): Promise<void> {
    if (!canReload && !manual) {
        return
    }

    const loaded: boolean = await loadBackupFiles()
    if (loaded) {
        if (manual && canReload) {
            // do nothing if the reloading process is working and user
            // requests additional reload in between
        } else {
            // set new timeout only for automatic reload or reload recovery
            reloadTimeoutId = setTimeout(reload, reloadInterval)
        }
        canReload = true
    } else {
        // we don't want to spam user server is down, user needs to refresh manually
        canReload = false
    }
}

loadBackupFiles().then(() => {
    reloadTimeoutId = setTimeout(reload, reloadInterval)
})
onUnmounted(() => clearInterval(reloadTimeoutId))

defineExpose<{
    reload(manual: boolean): Promise<void>
}>({
    reload
})
</script>

<template>
    <ServerFileList
        v-if="backupFilesLoaded && backupFileItems.length > 0"
        :connection="connection"
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
                :connection="connection"
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
