<script setup lang="ts">

import { MetadataGroup} from '@/modules/traffic-viewer/model/TrafficRecordVisualisationDefinition'
import RecordMetadataGroup from '@/modules/traffic-viewer/components/RecordMetadataGroup.vue'

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
