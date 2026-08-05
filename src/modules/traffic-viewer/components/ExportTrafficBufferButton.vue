<script setup lang="ts">

/**
 * Exports the current traffic recording buffer of a catalog into a downloadable archive on demand. Opens the export
 * dialog, then tracks progress of the created server task and downloads the resulting archive to the user once
 * the task finishes.
 */

import { errorMessage } from '@/utils/error'
import { useI18n } from 'vue-i18n'
import { computed, onUnmounted, ref } from 'vue'
import { useToaster } from '@/modules/notification/service/Toaster'
import type { Toaster } from '@/modules/notification/service/Toaster'
import { TrafficViewerService, useTrafficViewerService } from '@/modules/traffic-viewer/service/TrafficViewerService'
import { TaskStatus } from '@/modules/database-driver/request-response/task/TaskStatus'
import { TaskState } from '@/modules/database-driver/request-response/task/TaskState'
import { FileTaskResult } from '@/modules/database-driver/request-response/task/FileTaskResult'
import { ServerFile } from '@/modules/database-driver/request-response/server-file/ServerFile'
import { Uuid } from '@/modules/database-driver/data-type/Uuid'
import ExportTrafficBufferDialog from '@/modules/traffic-viewer/components/ExportTrafficBufferDialog.vue'

/**
 * Interval in milliseconds in which progress of the export task is refreshed.
 */
const taskPollingInterval: number = 2000
/**
 * Interval in milliseconds for which the button stays inactive after a finished download, because browsers
 * seem to take time before the file is actually downloaded.
 */
const downloadCooldown: number = 3000
/**
 * Minimum interval in milliseconds between two progress updates written to the reactive state while
 * downloading, so that a large archive arriving in thousands of chunks doesn't flood the UI.
 */
const progressUpdateInterval: number = 250

enum State {
    Idle = 'idle',
    Exporting = 'exporting',
    Downloading = 'downloading',
    Downloaded = 'downloaded'
}

const trafficViewerService: TrafficViewerService = useTrafficViewerService()
const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<{
    catalogName: string,
    available: boolean
}>()
const emit = defineEmits<{
    (e: 'unavailable'): void
}>()

const showExportDialog = ref<boolean>(false)
const state = ref<State>(State.Idle)
const progress = ref<number>(0)

const inProgress = computed<boolean>(() => state.value === State.Exporting || state.value === State.Downloading)
const disabled = computed<boolean>(() => !props.available || state.value !== State.Idle)
// the task reports no progress until it actually starts exporting, and the download reports none until
// its first chunk arrives
const indeterminateProgress = computed<boolean>(() => progress.value === 0)

let pollingTimeoutId: ReturnType<typeof setTimeout> | undefined = undefined
let downloadUrl: string | undefined = undefined
let lastProgressUpdate: number = 0
onUnmounted(() => {
    clearTimeout(pollingTimeoutId)
    revokeDownloadUrl()
})

function onExportStarted(createdTask: TaskStatus): void {
    state.value = State.Exporting
    progress.value = createdTask.progress
    schedulePolling(createdTask.taskId)
}

function schedulePolling(taskId: Uuid): void {
    pollingTimeoutId = setTimeout(() => pollTask(taskId), taskPollingInterval)
}

async function pollTask(taskId: Uuid): Promise<void> {
    let task: TaskStatus | undefined
    try {
        task = await trafficViewerService.getTaskStatus(taskId)
    } catch (e) {
        await reportFailedExport(t(
            'trafficViewer.recordHistory.notification.couldNotExportBuffer',
            { reason: errorMessage(e) }
        ))
        return
    }

    if (task == undefined) {
        await reportFailedExport(t('trafficViewer.recordHistory.notification.exportTaskLost'))
        return
    }

    progress.value = task.progress

    switch (task.state) {
        case TaskState.Failed:
            // the server doesn't validate the recorder presence before the task is created, therefore the recorder
            // being gone surfaces only as a failed task
            if (task.exception != undefined
                && task.exception.toLowerCase().includes('no on-demand traffic recording has been started')) {
                emit('unavailable')
            }
            await reportFailedExport(t(
                'trafficViewer.recordHistory.notification.couldNotExportBuffer',
                { reason: task.exception ?? t('trafficViewer.recordHistory.notification.unknownExportFailureReason') }
            ))
            return
        case TaskState.Finished:
            await downloadExportedFile(task)
            return
        default:
            schedulePolling(taskId)
    }
}

async function downloadExportedFile(task: TaskStatus): Promise<void> {
    state.value = State.Downloading
    progress.value = 0
    lastProgressUpdate = 0
    const exportedFile: ServerFile | undefined = (task.result as FileTaskResult | undefined)?.value
    if (exportedFile == undefined) {
        await reportFailedExport(t('trafficViewer.recordHistory.notification.exportTaskLost'))
        return
    }

    try {
        const blob: Blob = await trafficViewerService.fetchExportedFile(
            exportedFile.fileId,
            { onProgress: onDownloadProgress }
        )

        revokeDownloadUrl()
        downloadUrl = URL.createObjectURL(blob)
        const link: HTMLAnchorElement = document.createElement('a')
        link.href = downloadUrl
        link.download = exportedFile.name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    } catch (e) {
        await reportFailedExport(t(
            'trafficViewer.recordHistory.notification.couldNotDownloadExportedFile',
            { reason: errorMessage(e) }
        ))
        return
    }

    state.value = State.Downloaded
    setTimeout(() => resetState(), downloadCooldown)
    await toaster.success(t(
        'trafficViewer.recordHistory.notification.exportReady',
        { catalogName: props.catalogName }
    ))
}

function onDownloadProgress(bytesRead: bigint, totalSizeInBytes: bigint): void {
    if (totalSizeInBytes === 0n) {
        return
    }
    const now: number = performance.now()
    const finished: boolean = bytesRead >= totalSizeInBytes
    if (!finished && progress.value !== 0 && now - lastProgressUpdate < progressUpdateInterval) {
        return
    }
    lastProgressUpdate = now
    progress.value = Number(bytesRead * 100n / totalSizeInBytes)
}

async function reportFailedExport(message: string): Promise<void> {
    resetState()
    await toaster.error(message)
}

function resetState(): void {
    clearTimeout(pollingTimeoutId)
    pollingTimeoutId = undefined
    progress.value = 0
    state.value = State.Idle
    revokeDownloadUrl()
}

function revokeDownloadUrl(): void {
    if (downloadUrl != undefined) {
        URL.revokeObjectURL(downloadUrl)
        downloadUrl = undefined
    }
}
</script>

<template>
    <ExportTrafficBufferDialog
        v-model="showExportDialog"
        :catalog-name="catalogName"
        @export="onExportStarted"
    >
        <template #activator="{ props: dialogProps }">
            <span>
                <VBtn
                    icon
                    density="compact"
                    :loading="inProgress"
                    :disabled="disabled"
                    @click="showExportDialog = true"
                    v-bind="dialogProps"
                >
                    <VIcon>mdi-progress-download</VIcon>

                    <template #loader>
                        <VProgressCircular
                            :model-value="progress"
                            :indeterminate="indeterminateProgress"
                            size="20"
                            width="2"
                        />
                    </template>
                </VBtn>

                <VTooltip activator="parent">
                    <template v-if="available">
                        <div>{{ t('trafficViewer.recordHistory.button.exportTrafficBuffer') }}</div>
                        <div class="text-disabled">
                            {{ t('trafficViewer.recordHistory.button.exportTrafficBufferHelp') }}
                        </div>
                    </template>
                    <template v-else>
                        {{ t('trafficViewer.recordHistory.button.exportTrafficBufferUnavailable') }}
                    </template>
                </VTooltip>
            </span>
        </template>
    </ExportTrafficBufferDialog>
</template>

<style lang="scss" scoped>

</style>
