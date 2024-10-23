<script setup lang="ts">

import { ServerFile } from '@/modules/connection/model/server-file/ServerFile'
import { computed } from 'vue'
import { formatByteSize } from '@/utils/string'

const props = defineProps<{
    file: ServerFile
}>()

const fileSize = computed<string>(() => {
    return formatByteSize(Number(props.file.totalSizeInBytes))
})
</script>

<template>
    <span class="server-file-title">
        <span>{{ file.name }}</span>

        <!-- not using chip group because of https://github.com/vuetifyjs/vuetify/issues/19678 -->
        <span class="server-file-title__chips">
            <VChip>
                {{ fileSize }}
            </VChip>
        </span>
    </span>
</template>

<style lang="scss" scoped>
.server-file-title {
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
