<script setup lang="ts">

import VMissingDataIndicator from '@/modules/base/component/VMissingDataIndicator.vue'
import { useI18n } from 'vue-i18n'
import { computed, onUnmounted, ref, watch } from 'vue'
import { PaginatedList } from '@/modules/connection/model/PaginatedList'
import { ServerFile } from '@/modules/connection/model/server-file/ServerFile'
import { JfrViewerService, useJfrViewerService } from '@/modules/jfr-viewer/service/JfrViewerService'
import { Toaster, useToaster } from '@/modules/notification/service/Toaster'
import { Connection } from '@/modules/connection/model/Connection'
import ServerFileList from '@/modules/server-file-viewer/component/ServerFileList.vue'

const jfrViewerService: JfrViewerService = useJfrViewerService()
const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<{
    connection: Connection
    recordingsInPreparationPresent: boolean
}>()

const recordingsLoaded = ref<boolean>(false)
const recordings = ref<PaginatedList<ServerFile> | undefined>()
const recordingItems = computed<ServerFile[]>(() => {
    if (recordings.value == undefined) {
        return []
    }
    return recordings.value.data.toArray()
})

const pageNumber = ref<number>(1)
watch(pageNumber, async () => {
    await loadRecordings()
})
const pageCount = computed<number>(() => {
    if (recordings.value == undefined) {
        return 1
    }
    return Math.ceil(recordings.value.totalNumberOfRecords / pageSize.value)
})
const pageSize = ref<number>(20)

async function loadRecordings(): Promise<boolean> {
    try {
        recordings.value = await jfrViewerService.getRecordings(props.connection)

        if (recordings.value.pageNumber > 1 && recordings.value?.data.size === 0) {
            pageNumber.value--
        }
        if (!recordingsLoaded.value) {
            recordingsLoaded.value = true
        }
        return true
    } catch (e: any) {
        toaster.error(t(
            'jfrViewer.notification.couldNotLoadRecordings',
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

    const loaded: boolean = await loadRecordings()
    if (loaded) {
        if (manual && canReload) {
            // do nothing if the reloading process is working and user
            // requests additional reload in between
        } else {
            // set new timeout only for automatic reload or reload recovery
            reloadTimeoutId = setTimeout(reload, 5000)
        }
        canReload = true
    } else {
        // we don't want to spam user server is down, user needs to refresh manually
        canReload = false
    }
}

loadRecordings().then(() => {
    reloadTimeoutId = setTimeout(reload, 5000)
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
        v-if="recordingsLoaded && recordingItems.length > 0"
        :connection="connection"
        :files="recordingItems"
        v-model:page-number="pageNumber"
        :page-size="pageSize"
        :page-count="pageCount"
        @request-file-update="reload(true)"
    >
        <template v-if="recordingsInPreparationPresent" #subheader>
            {{ t('jfrViewer.list.title') }}
        </template>
    </ServerFileList>

    <VMissingDataIndicator
        v-else
        icon="mdi-record-circle-outline"
        :title="t('jfrViewer.list.noRecordings')"
    />
</template>

<style lang="scss" scoped>

</style>
