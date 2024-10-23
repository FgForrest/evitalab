<script setup lang="ts">

import ServerFileTitle from '@/modules/server-file-viewer/component/ServerFileTitle.vue'
import { Connection } from '@/modules/connection/model/Connection'
import { ServerFile } from '@/modules/connection/model/server-file/ServerFile'
import DeleteServerFileButton from '@/modules/server-file-viewer/component/DeleteServerFileButton.vue'
import DownloadServerFileButton from '@/modules/server-file-viewer/component/DownloadServerFileButton.vue'

const props = defineProps<{
    connection: Connection,
    file: ServerFile
}>()
const emit = defineEmits<{
    (e: 'requestFileUpdate'): void
    (e: 'requestTaskUpdate'): void
}>()
</script>

<template>
    <VListItem>
        <template #prepend>
            <VIcon>mdi-file-outline</VIcon>
        </template>

        <template #title>
            <ServerFileTitle :file="file" />
        </template>

        <template #append>
            <slot name="append" :file="file" />

            <DeleteServerFileButton
                :connection="connection"
                :file="file"
                @delete="emit('requestFileUpdate')"
            />
            <DownloadServerFileButton
                :connection="connection"
                :file="file"
            />
        </template>
    </VListItem>
</template>

<style lang="scss" scoped>

</style>
