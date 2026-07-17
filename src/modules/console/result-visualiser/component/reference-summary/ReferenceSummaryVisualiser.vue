<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { VisualisedReferenceSummary } from '@/modules/console/result-visualiser/model/reference-summary/VisualisedReferenceSummary'
import ReferenceGroupStatisticsListVisualiser
    from '@/modules/console/result-visualiser/component/reference-summary/ReferenceGroupStatisticsListVisualiser.vue'
import VMissingDataIndicator from '@/modules/base/component/VMissingDataIndicator.vue'
import { VExpansionPanels, VExpansionPanel, VExpansionPanelTitle, VExpansionPanelText } from 'vuetify/components'

const { t } = useI18n()

defineProps<{
    referenceSummary: VisualisedReferenceSummary
}>()
</script>

<template>
    <VExpansionPanels v-if="referenceSummary.references.length > 0">
        <VExpansionPanel v-for="referenceStatistics in referenceSummary.references" :key="referenceStatistics.referenceSchema.name">
            <VExpansionPanelTitle>
                <VIcon class="mr-8">mdi-link-variant</VIcon>
                {{ referenceStatistics.referenceSchema.name }} ({{ referenceStatistics.statisticsCount() }})
            </VExpansionPanelTitle>
            <VExpansionPanelText>
                <ReferenceGroupStatisticsListVisualiser
                    :reference-statistics="referenceStatistics"
                />
            </VExpansionPanelText>
        </VExpansionPanel>
    </VExpansionPanels>

    <VMissingDataIndicator
        v-else
        icon="mdi-text-search"
        :title="t('resultVisualizer.referenceSummaryVisualiser.placeholder.noGroups')"
    />
</template>

<style lang="scss" scoped>

</style>
