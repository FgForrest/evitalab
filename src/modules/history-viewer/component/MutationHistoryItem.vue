<script setup lang="ts">

/**
 * Visualises a single mutation record base on its implementation
 */

import VListItemDivider from '@/modules/base/component/VListItemDivider.vue'
import type {
    MutationHistoryItemVisualisationDefinition
} from '@/modules/history-viewer/model/MutationHistoryItemVisualisationDefinition.ts'
import MutationHistoryItemDetail from '@/modules/history-viewer/component/MutationHistoryItemDetail.vue'

withDefaults(
    defineProps<{
        visualisationDefinition: MutationHistoryItemVisualisationDefinition,
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
            <MutationHistoryItemDetail :definition="visualisationDefinition" v-bind="props" />
            <VListItemDivider v-if="isOpen" />
        </template>

        <template
            v-for="(child, index) in visualisationDefinition.children"
            :key="`${child.source.version}:${child.source.index}`"
        >
            <MutationHistoryItem :visualisation-definition="child" has-parent />
            <VListItemDivider v-if="index < visualisationDefinition.children.size - 1"/>
        </template>
    </VListGroup>

    <MutationHistoryItemDetail v-else :definition="visualisationDefinition" :prepend-icon="hasParent ? 'mdi-arrow-right-bottom' : undefined"/>
</template>

<style lang="scss" scoped>

</style>
