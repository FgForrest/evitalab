<script setup lang="ts">

import { ServerFile } from '@/modules/connection/model/server-file/ServerFile'
import { computed } from 'vue'
import { formatByteSize } from '@/utils/string'

const props = defineProps<{
    recordingFile: ServerFile
}>()

const fileSize = computed<string>(() => {
    return formatByteSize(Number(props.recordingFile.totalSizeInBytes))
})
</script>

<template>
    <span class="recording-title">
        <span>{{ recordingFile.name }}</span>

        <!-- not using chip group because of https://github.com/vuetifyjs/vuetify/issues/19678 -->
        <span class="recording-title__chips">
            <VChip>
                {{ fileSize }}
            </VChip>
        </span>
    </span>
</template>

<style lang="scss" scoped>
.recording-title {
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-flow: row wrap;
    max-height: 1.5rem;

    &__chips {
        display: flex;
        gap: 0.5rem;
        align-items: center;
    }
}
</style>
