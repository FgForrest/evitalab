<script setup lang="ts">
/**
 * Visualises a fully resolved price histogram.
 */
import { useI18n } from 'vue-i18n'
import { VisualisedHistogram } from '@/modules/console/result-visualiser/model/histogram/VisualisedHistogram'
import HistogramVisualiser from '@/modules/console/result-visualiser/component/histogram/HistogramVisualiser.vue'
import VMissingDataIndicator from '@/modules/base/component/VMissingDataIndicator.vue'

const { t } = useI18n()

const props = defineProps<{
    histogram: VisualisedHistogram
}>()
</script>

<template>
    <HistogramVisualiser v-if="histogram" :histogram="histogram" />

    <VMissingDataIndicator
        v-else
        icon="mdi-text-search"
        :title="t('resultVisualizer.priceHistogram.placeholder.noPriceHistograms')"
    />
</template>

<style lang="scss" scoped>

</style>
