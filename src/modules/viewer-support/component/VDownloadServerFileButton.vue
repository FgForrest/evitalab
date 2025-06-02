<script setup lang="ts">
/**
 * Universal button for downloading server files to user.
 */

import { ref } from 'vue'
import { ServerFile } from '@/modules/database-driver/request-response/server-file/ServerFile'
import { EvitaClient, useEvitaClient } from '@/modules/database-driver/EvitaClient'

enum State {
    CanBeDownloaded = 'canBeDownloaded',
    Preparing = 'preparing',
    Downloaded = 'downloaded'
}

const evitaClient: EvitaClient = useEvitaClient()

const props = defineProps<{
    file: ServerFile
}>()
const emit = defineEmits<{
    (e: 'error', value: Error): void
}>()

const state = ref<State>(State.CanBeDownloaded)

async function download(): Promise<void> {
    if (state.value !== State.CanBeDownloaded) {
        return
    }

    state.value = State.Preparing

    try {
        const blob = await evitaClient.management.fetchFile(props.file.fileId)

        const downloadUrl = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = props.file.name
        document.body.appendChild(link)
        link.click()
    } catch (e: any) {
        emit('error', e)
    }

    state.value = State.Downloaded
    // do not allow downloading right away, browsers seem to take time
    // before the file is actually downloaded
    setTimeout(() => state.value = State.CanBeDownloaded, 3000)
}
</script>

<template>
    <VBtn
        icon
        :loading="state === State.Preparing"
        :disabled="state === State.Downloaded"
        @click="download"
    >
        <VIcon>mdi-file-download-outline</VIcon>
        <VTooltip activator="parent">
            <slot />
        </VTooltip>
    </VBtn>
</template>

<style lang="scss" scoped>

</style>
