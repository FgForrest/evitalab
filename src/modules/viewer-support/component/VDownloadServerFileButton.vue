<script setup lang="ts">
/**
 * Universal button for downloading server files to user.
 *
 * Streams the file from the server and reports progress on the button itself. Where the File System
 * Access save picker is available (Chromium in a secure context) the bytes are written straight to
 * the file the user picked; everywhere else they are accumulated into a windowed blob and handed to
 * the browser through a generated `<a download>` click. Clicking the button while a download runs
 * cancels it.
 */

import { asError } from '@/utils/error'
import { computed, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ServerFile } from '@/modules/database-driver/request-response/server-file/ServerFile'
import { EvitaClient, useEvitaClient } from '@/modules/database-driver/EvitaClient'
import { Code, ConnectError } from '@connectrpc/connect'
import { formatByteSize } from '@/utils/string'
import { WindowedBlobAccumulator } from '@/utils/blob'
import { useToaster } from '@/modules/notification/service/Toaster'
import type { Toaster } from '@/modules/notification/service/Toaster'

/**
 * Interval in milliseconds for which the button stays inactive after a finished blob download, because
 * browsers seem to take time before the file is actually downloaded. The object URL is revoked only
 * after it elapses, revoking it right after the click can cancel the download in some browsers.
 */
const downloadCooldown: number = 3000
/**
 * Minimum interval in milliseconds between two progress updates written to the reactive state. A
 * multi-gigabyte file arrives in tens of thousands of chunks, and updating the UI for each of them
 * would starve the decoding loop on the main thread.
 */
const progressUpdateInterval: number = 250
/**
 * Number of accumulated bytes after which the fallback download path wraps the received chunks into
 * an intermediate blob, keeping heap residency bounded regardless of the file size.
 */
const blobPartWindowBytes: number = 32 * 1024 * 1024

enum State {
    CanBeDownloaded = 'canBeDownloaded',
    Preparing = 'preparing',
    Downloaded = 'downloaded'
}

const evitaClient: EvitaClient = useEvitaClient()
const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<{
    file: ServerFile
}>()
const emit = defineEmits<{
    (e: 'error', value: Error | undefined): void
}>()

const state = ref<State>(State.CanBeDownloaded)
const bytesRead = ref<bigint>(0n)
const totalSizeInBytes = ref<bigint>(0n)

const downloading = computed<boolean>(() => state.value === State.Preparing)
const indeterminateProgress = computed<boolean>(() =>
    totalSizeInBytes.value === 0n || bytesRead.value === 0n)
const progress = computed<number>(() => {
    if (totalSizeInBytes.value === 0n) {
        return 0
    }
    return Number(bytesRead.value * 100n / totalSizeInBytes.value)
})
const tooltip = computed<string | undefined>(() => {
    if (!downloading.value) {
        return undefined
    }
    if (indeterminateProgress.value) {
        return t('common.download.preparing')
    }
    return t('common.download.progress', {
        percent: progress.value,
        transferred: formatByteSize(Number(bytesRead.value)),
        total: formatByteSize(Number(totalSizeInBytes.value))
    })
})

let abortController: AbortController | undefined = undefined
let cooldownTimeoutId: ReturnType<typeof setTimeout> | undefined = undefined
let objectUrl: string | undefined = undefined
let lastProgressUpdate: number = 0
let unmounted: boolean = false

onUnmounted(() => {
    unmounted = true
    abortController?.abort()
    clearTimeout(cooldownTimeoutId)
    revokeObjectUrl()
})

function onClick(): void {
    if (state.value === State.Preparing) {
        // while a download runs, the button itself is the cancel affordance
        abortController?.abort()
        return
    }
    void download()
}

async function download(): Promise<void> {
    if (state.value !== State.CanBeDownloaded) {
        return
    }

    // the save picker must be opened within the click task, therefore before any other await
    let fileHandle: FileSystemFileHandle | undefined
    if (saveFilePickerAvailable()) {
        try {
            fileHandle = await window.showSaveFilePicker!({ suggestedName: props.file.name })
        } catch (e) {
            // the user dismissed the picker; nothing has been fetched yet
            if (!isCancellation(e)) {
                emit('error', asError(e))
            }
            return
        }
    }

    resetProgress()
    state.value = State.Preparing
    abortController = new AbortController()
    const signal: AbortSignal = abortController.signal

    try {
        if (fileHandle == undefined) {
            await downloadThroughBlob(signal)
        } else {
            await downloadIntoPickedFile(fileHandle, signal)
        }
    } catch (e) {
        abortController = undefined
        state.value = State.CanBeDownloaded
        if (!isCancellation(e, signal)) {
            emit('error', asError(e))
        }
        return
    }

    abortController = undefined
    state.value = State.Downloaded
    cooldownTimeoutId = setTimeout(() => {
        state.value = State.CanBeDownloaded
        revokeObjectUrl()
    }, downloadCooldown)
}

/**
 * Streams the file straight into the location picked by the user. Nothing but a single chunk is ever
 * held in memory.
 */
async function downloadIntoPickedFile(fileHandle: FileSystemFileHandle, signal: AbortSignal): Promise<void> {
    const writable: FileSystemWritableFileStream = await fileHandle.createWritable()
    try {
        for await (const chunk of fetchChunks(signal)) {
            await writable.write(chunk.contents)
        }
    } catch (e) {
        await abortWritable(writable)
        throw e
    }
    await writable.close()
}

/**
 * Accumulates the file into a blob with bounded heap residency and hands it to the browser through a
 * generated `<a download>` click. Used where the save picker is unavailable.
 */
async function downloadThroughBlob(signal: AbortSignal): Promise<void> {
    const accumulator: WindowedBlobAccumulator = new WindowedBlobAccumulator(blobPartWindowBytes)
    for await (const chunk of fetchChunks(signal)) {
        accumulator.push(chunk.contents)
    }

    revokeObjectUrl()
    objectUrl = URL.createObjectURL(accumulator.finish())
    const link: HTMLAnchorElement = document.createElement('a')
    link.href = objectUrl
    link.download = props.file.name
    document.body.appendChild(link)
    try {
        link.click()
    } finally {
        link.remove()
    }
}

function fetchChunks(signal: AbortSignal) {
    return evitaClient.management.fetchFileStream(
        props.file.fileId,
        {
            signal,
            onProgress: onProgress
        }
    )
}

function onProgress(read: bigint, total: bigint): void {
    const now: number = performance.now()
    const finished: boolean = total > 0n && read >= total
    if (!finished && bytesRead.value !== 0n && now - lastProgressUpdate < progressUpdateInterval) {
        return
    }
    lastProgressUpdate = now
    bytesRead.value = read
    totalSizeInBytes.value = total
}

function resetProgress(): void {
    bytesRead.value = 0n
    // the total is taken from the server's own per-chunk report rather than from the listed file size,
    // so the displayed percentage can never disagree with the counted bytes
    totalSizeInBytes.value = 0n
    lastProgressUpdate = 0
}

/**
 * Discards the file the picker already created at the location the user chose. It cannot be deleted
 * from here, so the user is warned that what is there is not the requested file — unless the whole tab
 * is going away, where a toast about a closed view would only be noise.
 */
async function abortWritable(writable: FileSystemWritableFileStream): Promise<void> {
    try {
        await writable.abort()
    } catch {
        // the stream may already be errored; nothing more can be done about the file on disk
    }
    if (!unmounted) {
        await toaster.warning(t(
            'common.notification.downloadIncomplete',
            { fileName: props.file.name }
        ))
    }
}

/**
 * The save picker is exposed only in secure contexts and only by Chromium-based browsers.
 */
function saveFilePickerAvailable(): boolean {
    return 'showSaveFilePicker' in window && window.isSecureContext
}

/**
 * Recognizes all three shapes a cancellation can take: the aborted gRPC stream (`Code.Canceled`), the
 * save picker dismissed by the user (an `AbortError`) and — for anything else that failed while the
 * download was being given up on — the aborted signal itself.
 */
function isCancellation(e: unknown, signal?: AbortSignal): boolean {
    if (e instanceof ConnectError) {
        return e.code === Code.Canceled
    }
    if (e instanceof DOMException && e.name === 'AbortError') {
        return true
    }
    return signal?.aborted === true
}

function revokeObjectUrl(): void {
    if (objectUrl != undefined) {
        URL.revokeObjectURL(objectUrl)
        objectUrl = undefined
    }
}
</script>

<template>
    <VBtn
        icon
        :loading="downloading"
        :disabled="state === State.Downloaded"
        :aria-label="downloading ? t('common.button.cancelDownload') : undefined"
        @click="onClick"
    >
        <VIcon>mdi-file-download-outline</VIcon>

        <template #loader>
            <VProgressCircular
                :model-value="progress"
                :indeterminate="indeterminateProgress"
                size="20"
                width="2"
            />
        </template>

        <VTooltip activator="parent">
            <template v-if="downloading">
                <div>{{ tooltip }}</div>
                <div class="text-disabled">{{ t('common.button.cancelDownload') }}</div>
            </template>
            <slot v-else />
        </VTooltip>
    </VBtn>
</template>

<style lang="scss" scoped>

</style>
