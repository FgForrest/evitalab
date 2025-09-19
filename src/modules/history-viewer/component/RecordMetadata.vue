<script setup lang="ts">


import type { MetadataGroup } from '@/modules/history-viewer/model/MutationHistoryItemVisualisationDefinition.ts'
import RecordMetadataGroup from '@/modules/history-viewer/component/RecordMetadataGroup.vue'

const props = defineProps<{
    metadata: MetadataGroup[]
}>()
</script>

<template>
    <div class="record-metadata">
        <RecordMetadataGroup
            v-for="(metadataGroup, index) in metadata"
            :key="index"
            :group="metadataGroup"
        />
    </div>
</template>

<style lang="scss" scoped>
.record-metadata {
    display: flex;
    flex-direction: column;
    row-gap: 0.25rem;
    margin-top: 0.25rem;
}
</style>
