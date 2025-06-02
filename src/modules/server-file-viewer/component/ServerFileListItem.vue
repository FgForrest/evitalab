<script setup lang="ts">

import ServerFileTitle from '@/modules/server-file-viewer/component/ServerFileTitle.vue'
import { ServerFile } from '@/modules/database-driver/request-response/server-file/ServerFile'
import DeleteServerFileButton from '@/modules/server-file-viewer/component/DeleteServerFileButton.vue'
import DownloadServerFileButton from '@/modules/server-file-viewer/component/DownloadServerFileButton.vue'

const props = defineProps<{
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
                :file="file"
                @delete="emit('requestFileUpdate')"
            />
            <DownloadServerFileButton
                :file="file"
            />
        </template>
    </VListItem>
</template>

<style lang="scss" scoped>

</style>
