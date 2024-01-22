<script setup lang="ts">
/**
 * Visualises overall histogram info.
 */

import { VisualisedHistogram } from '@/model/editor/result-visualiser'
import VMarkdown from '@/components/base/VMarkdown.vue'

const props = defineProps<{
    histogram: VisualisedHistogram
}>()
</script>

<template>
    <div class="histogram-info">
        <span>
            <template v-if="histogram.min != undefined">
                {{ histogram.min }}
            </template>
            <span v-else>
                unknown
                <VTooltip activator="parent">
                    <VMarkdown source="No `min` property of the histogram was fetched." />
                </VTooltip>
            </span>
            &nbsp;<span class="text-disabled">&lt;</span>
        </span>
        <span>
            <span class="text-disabled">Overall count:</span>&nbsp;
            <template v-if="histogram.overallCount != undefined">
                {{ histogram.overallCount }}
            </template>
            <span v-else>
                unknown
                <VTooltip activator="parent">
                    <VMarkdown source="No `overallCount` property of the histogram was fetched." />
                </VTooltip>
            </span>
        </span>
        <span>
            <span class="text-disabled">&gt;</span>&nbsp;
            <template v-if="histogram.max != undefined">
                {{ histogram.max }}
            </template>
            <span v-else>
                unknown
                <VTooltip activator="parent">
                    <VMarkdown source="No `max` property of the histogram was fetched." />
                </VTooltip>
            </span>
        </span>
    </div>
</template>

<style lang="scss" scoped>
.histogram-info {
    display: flex;
    column-gap: 0.5rem;
    justify-content: space-between;
    flex-wrap: wrap;
    padding: 0.5rem 0.75rem 0;
}
</style>
