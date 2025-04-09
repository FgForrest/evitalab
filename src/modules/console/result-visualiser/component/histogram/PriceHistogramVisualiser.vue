<script setup lang="ts">
/**
 * Visualises the raw JSON price histogram.
 */

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Toaster, useToaster } from '@/modules/notification/service/Toaster'
import { ResultVisualiserService } from '@/modules/console/result-visualiser/service/ResultVisualiserService'
import { Result } from '@/modules/console/result-visualiser/model/Result'
import { VisualisedHistogram } from '@/modules/console/result-visualiser/model/histogram/VisualisedHistogram'
import HistogramVisualiser from '@/modules/console/result-visualiser/component/histogram/HistogramVisualiser.vue'
import VMissingDataIndicator from '@/modules/base/component/VMissingDataIndicator.vue'

const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<{
    visualiserService: ResultVisualiserService,
    priceHistogramResult: Result
}>()

const histogram = computed<VisualisedHistogram | undefined>(() => {
    try {
        return props.visualiserService
            .getPriceHistogramService()
            .resolvePriceHistogram(props.priceHistogramResult)
    } catch (e: any) {
        toaster.error('Could not resolve price histogram', e).then() // todo lho i18n
        return undefined
    }
})
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
