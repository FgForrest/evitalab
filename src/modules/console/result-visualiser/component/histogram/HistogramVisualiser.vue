<script setup lang="ts">/**
 * Visualises histogram extracted from JSON extra results.
 */
import { VisualisedHistogram } from '@/modules/console/result-visualiser/model/histogram/VisualisedHistogram'
import HistogramChart from '@/modules/console/result-visualiser/component/histogram/HistogramChart.vue'
import HistogramRange from '@/modules/console/result-visualiser/component/histogram/HistogramRange.vue'
import HistogramInfo from '@/modules/console/result-visualiser/component/histogram/HistogramInfo.vue'


const props = defineProps<{
    histogram: VisualisedHistogram
}>()
</script>

<template>
    <div class="histogram">
        <HistogramChart :histogram="histogram" />
        <HistogramRange :histogram="histogram" />
        <HistogramInfo :histogram="histogram" />
    </div>
</template>

<style lang="scss" scoped>
</style>
