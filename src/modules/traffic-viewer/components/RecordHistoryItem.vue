<script setup lang="ts">

/**
 * Visualises a single traffic record base on its implementation
 */

import {
    TrafficRecordVisualisationDefinition
} from '@/modules/traffic-viewer/model/TrafficRecordVisualisationDefinition'
import RecordHistoryItemDetail from '@/modules/traffic-viewer/components/RecordHistoryItemDetail.vue'
import VListItemDivider from '@/modules/base/component/VListItemDivider.vue'

const props = withDefaults(
    defineProps<{
        visualisationDefinition: TrafficRecordVisualisationDefinition,
        hasParent?: boolean
    }>(),
    {
        hasParent: false
    }
)
</script>

<template>
    <VListGroup v-if="visualisationDefinition.children.size > 0" :prepend-icon="hasParent ? 'mdi-arrow-right-bottom' : undefined">
        <template #activator="{ props, isOpen }">
            <RecordHistoryItemDetail :definition="visualisationDefinition" v-bind="props" />
            <VListItemDivider v-if="isOpen" />
        </template>

        <template
            v-for="(child, index) in visualisationDefinition.children"
            :key="`${child.source.sessionSequenceOrder}:${child.source.recordSessionOffset}`"
        >
            <RecordHistoryItem :visualisation-definition="child" has-parent />
            <VListItemDivider v-if="index < visualisationDefinition.children.size - 1"/>
        </template>
    </VListGroup>

    <RecordHistoryItemDetail v-else :definition="visualisationDefinition" :prepend-icon="hasParent ? 'mdi-arrow-right-bottom' : undefined"/>
</template>

<style lang="scss" scoped>

</style>
