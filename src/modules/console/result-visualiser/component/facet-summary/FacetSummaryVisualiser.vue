<script setup lang="ts">
/**
 * Visualises a fully resolved facet summary as expansion panels grouped by reference.
 */
import { useI18n } from 'vue-i18n'
import { VisualisedFacetSummary } from '@/modules/console/result-visualiser/model/facet-summary/VisualisedFacetSummary'
import ReferenceFacetGroupStatisticsVisualiser
    from '@/modules/console/result-visualiser/component/facet-summary/ReferenceFacetGroupStatisticsVisualiser.vue'
import VMissingDataIndicator from '@/modules/base/component/VMissingDataIndicator.vue'
import { VExpansionPanels, VExpansionPanel, VExpansionPanelTitle, VExpansionPanelText } from 'vuetify/components'

const { t } = useI18n()

defineProps<{
    facetSummary: VisualisedFacetSummary
}>()
</script>

<template>
    <VExpansionPanels v-if="facetSummary.references.length > 0">
        <VExpansionPanel v-for="referenceFacets in facetSummary.references" :key="referenceFacets.referenceSchema.name">
            <VExpansionPanelTitle>
                <VIcon class="mr-8">mdi-link-variant</VIcon>
                {{ referenceFacets.referenceSchema.name }} ({{ referenceFacets.facetCount() }})
            </VExpansionPanelTitle>
            <VExpansionPanelText>
                <ReferenceFacetGroupStatisticsVisualiser
                    :reference-facets="referenceFacets"
                />
            </VExpansionPanelText>
        </VExpansionPanel>
    </VExpansionPanels>

    <VMissingDataIndicator
        v-else
        icon="mdi-text-search"
        :title="t('resultVisualizer.facetStatisticsVisualiser.placeholder.noGroups')"
    />
</template>

<style lang="scss" scoped>

</style>
