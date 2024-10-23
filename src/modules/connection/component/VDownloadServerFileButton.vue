<script setup lang="ts">
/**
 * Universal button for downloading server files to user.
 */

import { ref } from 'vue'
import { ConnectionService, useConnectionService } from '@/modules/connection/service/ConnectionService'
import { EvitaDBDriver } from '@/modules/connection/driver/EvitaDBDriver'
import { Connection } from '@/modules/connection/model/Connection'
import { ServerFile } from '@/modules/connection/model/server-file/ServerFile'

enum State {
    CanBeDownloaded = 'canBeDownloaded',
    Preparing = 'preparing',
    Downloaded = 'downloaded'
}

const connectionService: ConnectionService = useConnectionService()

const props = defineProps<{
    connection: Connection
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
        // todo lho refactor this after services refactor, maybe merge with server file viewer module?
        const driver: EvitaDBDriver = await connectionService.getDriver(props.connection)
        const blob = await driver.downloadFile(props.connection, props.file.fileId)

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
