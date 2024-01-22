<script setup lang="ts">
/**
 * Visualises histogram extracted from JSON extra results.
 */

import { VisualisedHistogram } from '@/model/editor/result-visualiser'
import LabEditorResultVisualiserHistogramInfo
    from '@/components/lab/editor/result-visualiser/histogram/LabEditorResultVisualiserHistogramInfo.vue'
import LabEditorResultVisualiserHistogramRange
    from '@/components/lab/editor/result-visualiser/histogram/LabEditorResultVisualiserHistogramRange.vue'
import LabEditorResultVisualiserHistogramChart
    from '@/components/lab/editor/result-visualiser/histogram/LabEditorResultVisualiserHistogramChart.vue'

const props = defineProps<{
    histogram: VisualisedHistogram
}>()
</script>

<template>
    <div class="histogram">
        <LabEditorResultVisualiserHistogramChart :histogram="histogram" />
        <LabEditorResultVisualiserHistogramRange :histogram="histogram" />
        <LabEditorResultVisualiserHistogramInfo :histogram="histogram" />
    </div>
</template>

<style lang="scss" scoped>
</style>
