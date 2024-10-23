<script setup lang="ts">
/**
 * Visualises overall histogram info.
 */

import { useI18n } from 'vue-i18n'
import { VisualisedHistogram } from '@/modules/console/result-visualiser/model/histogram/VisualisedHistogram'
import VMarkdown from '@/modules/base/component/VMarkdown.vue'

const { t } = useI18n()

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
                {{ t('resultVisualizer.histogram.placeholder.unknown') }}
                <VTooltip activator="parent">
                    <VMarkdown :source="t('resultVisualizer.histogram.help.noMinProperty')" />
                </VTooltip>
            </span>
            &nbsp;<span class="text-disabled">&lt;</span>
        </span>
        <span>
            <span class="text-disabled">{{ t('resultVisualizer.histogram.label.overallCount') }}:</span>&nbsp;
            <template v-if="histogram.overallCount != undefined">
                {{ histogram.overallCount }}
            </template>
            <span v-else>
                {{ t('resultVisualizer.histogram.placeholder.unknown') }}
                <VTooltip activator="parent">
                    <VMarkdown :source="t('resultVisualizer.histogram.help.noOverallCountProperty')" />
                </VTooltip>
            </span>
        </span>
        <span>
            <span class="text-disabled">&gt;</span>&nbsp;
            <template v-if="histogram.max != undefined">
                {{ histogram.max.toFloat() }}
            </template>
            <span v-else>
                {{ t('resultVisualizer.histogram.placeholder.unknown') }}
                <VTooltip activator="parent">
                    <VMarkdown :source="t('resultVisualizer.histogram.help.noMaxProperty')" />
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
