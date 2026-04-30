<script setup lang="ts">
/**
 * Visualises fully resolved attribute histograms as expansion panels grouped by attribute.
 */
import { useI18n } from 'vue-i18n'
import { VisualisedAttributeHistograms } from '@/modules/console/result-visualiser/model/histogram/VisualisedAttributeHistograms'
import HistogramVisualiser from '@/modules/console/result-visualiser/component/histogram/HistogramVisualiser.vue'
import VMissingDataIndicator from '@/modules/base/component/VMissingDataIndicator.vue'

const { t } = useI18n()

const props = defineProps<{
    attributeHistograms: VisualisedAttributeHistograms
}>()
</script>

<template>
    <VExpansionPanels v-if="attributeHistograms.histograms.length > 0">
        <VExpansionPanel v-for="attrHistogram in attributeHistograms.histograms" :key="attrHistogram.attributeSchema.name">
            <VExpansionPanelTitle class="d-flex">
                <VIcon class="mr-8">mdi-format-list-bulleted</VIcon>
                {{ attrHistogram.attributeSchema.name }}
            </VExpansionPanelTitle>
            <VExpansionPanelText>
                <HistogramVisualiser :histogram="attrHistogram.histogram"/>
            </VExpansionPanelText>
        </VExpansionPanel>
    </VExpansionPanels>

    <VMissingDataIndicator
        v-else
        icon="mdi-text-search"
        :title="t('resultVisualizer.attributeHistogram.placeholder.noAttributeHistograms')"
    />
</template>

<style lang="scss" scoped>

</style>
