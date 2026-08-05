<script setup lang="ts">
import { errorMessage } from '@/utils/error'

import VMissingDataIndicator from '@/modules/base/component/VMissingDataIndicator.vue'
import { useI18n } from 'vue-i18n'
import { computed, ref, watch } from 'vue'
import { PaginatedList } from '@/modules/database-driver/request-response/PaginatedList'
import { ServerFile } from '@/modules/database-driver/request-response/server-file/ServerFile'
import { useToaster, type Toaster } from '@/modules/notification/service/Toaster'
import ServerFileList from '@/modules/server-file-viewer/component/ServerFileList.vue'
import { useAutoReload } from '@/modules/viewer-support/composable/useAutoReload'
import { TrafficViewerService, useTrafficViewerService } from '@/modules/traffic-viewer/service/TrafficViewerService'

const reloadInterval: number = 5000

const trafficViewerService: TrafficViewerService = useTrafficViewerService()
const toaster: Toaster = useToaster()
const { t } = useI18n()

defineProps<{
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
    await reload(true)
})
const pageCount = computed<number>(() => {
    if (recordings.value == undefined) {
        return 1
    }
    return Math.ceil(recordings.value.totalNumberOfRecords / pageSize.value)
})
const pageSize = ref<number>(20)

async function loadRecordings(): Promise<void> {
    recordings.value = await trafficViewerService.getRecordings(pageNumber.value, pageSize.value)

    if (recordings.value.pageNumber > 1 && recordings.value?.data.size === 0) {
        pageNumber.value--
    }
    if (!recordingsLoaded.value) {
        recordingsLoaded.value = true
    }
}

const { reload } = useAutoReload(
    loadRecordings,
    reloadInterval,
    (e: unknown) => {
        toaster.error(t(
            'trafficViewer.recordings.notification.couldNotLoadRecordings',
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
        v-if="recordingsLoaded && recordingItems.length > 0"
        :files="recordingItems"
        v-model:page-number="pageNumber"
        :page-size="pageSize"
        :page-count="pageCount"
        @request-file-update="reload(true)"
    >
        <template v-if="recordingsInPreparationPresent" #subheader>
            {{ t('trafficViewer.recordings.list.title') }}
        </template>
    </ServerFileList>

    <VMissingDataIndicator
        v-else
        icon="mdi-record-circle-outline"
        :title="t('trafficViewer.recordings.list.noRecordings')"
    />
</template>

<style lang="scss" scoped>

</style>
