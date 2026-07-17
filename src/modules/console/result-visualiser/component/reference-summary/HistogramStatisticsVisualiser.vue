<script setup lang="ts">
/**
 * Renders a list of histogram statistics as expansion panels, each containing a HistogramVisualiser.
 */
import { VisualisedHistogramStatistics } from '@/modules/console/result-visualiser/model/reference-summary/VisualisedHistogramStatistics'
import HistogramVisualiser
    from '@/modules/console/result-visualiser/component/histogram/HistogramVisualiser.vue'

defineProps<{
    histograms: VisualisedHistogramStatistics[]
}>()
</script>

<template>
    <VExpansionPanels>
        <VExpansionPanel v-for="histStats in histograms" :key="histStats.indexName">
            <VExpansionPanelTitle>
                <VIcon class="mr-4">mdi-chart-bar</VIcon>
                {{ histStats.indexName }}
            </VExpansionPanelTitle>
            <VExpansionPanelText>
                <HistogramVisualiser :histogram="histStats.histogram" />
            </VExpansionPanelText>
        </VExpansionPanel>
    </VExpansionPanels>
</template>

<style lang="scss" scoped>
</style>
