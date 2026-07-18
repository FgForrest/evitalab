<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { VisualisedReferenceStatistics } from '@/modules/console/result-visualiser/model/reference-summary/VisualisedReferenceSummary'
import { VisualisedFacetStatistics } from '@/modules/console/result-visualiser/model/reference-summary/VisualisedFacetStatistics'
import { VisualisedHistogramStatistics } from '@/modules/console/result-visualiser/model/reference-summary/VisualisedHistogramStatistics'
import VListItemLazyIterator from '@/modules/base/component/VListItemLazyIterator.vue'
import ReferenceGroupStatisticsVisualiser
    from '@/modules/console/result-visualiser/component/reference-summary/ReferenceGroupStatisticsVisualiser.vue'
import FacetStatisticsVisualiser
    from '@/modules/console/result-visualiser/component/reference-summary/FacetStatisticsVisualiser.vue'
import HistogramStatisticsVisualiser
    from '@/modules/console/result-visualiser/component/reference-summary/HistogramStatisticsVisualiser.vue'

const { t } = useI18n()

const statisticsPageSize: number = 10

const props = defineProps<{
    referenceStatistics: VisualisedReferenceStatistics
}>()

const groupStatisticsResultsPage = ref<number>(1)

const isGroupedFacets = computed<boolean>(() => {
    return props.referenceStatistics.referenceSchema.referencedGroupType != undefined
})

const ungroupedFacets = computed<VisualisedFacetStatistics[]>(() => {
    if (isGroupedFacets.value) return []
    const firstGroup = props.referenceStatistics.groups[0]
    if (firstGroup == undefined) return []
    return firstGroup.facets
})

const ungroupedHistograms = computed<VisualisedHistogramStatistics[]>(() => {
    if (isGroupedFacets.value) return []
    const firstGroup = props.referenceStatistics.groups[0]
    if (firstGroup == undefined) return []
    return firstGroup.histograms
})

const hasUngroupedFacets = computed<boolean>(() => ungroupedFacets.value.length > 0)
const hasUngroupedHistograms = computed<boolean>(() => ungroupedHistograms.value.length > 0)
const hasBothUngroupedTypes = computed<boolean>(() => hasUngroupedFacets.value && hasUngroupedHistograms.value)

const facetStatisticsResultsPage = ref<number>(1)
</script>

<template>
    <VList density="compact">
        <template v-if="isGroupedFacets">
            <VListItemLazyIterator
                :items="referenceStatistics.groups"
                v-model:page="groupStatisticsResultsPage"
                :page-size="statisticsPageSize"
            >
                <template #item="{ item: facetGroup }">
                    <ReferenceGroupStatisticsVisualiser
                        :reference-schema="referenceStatistics.referenceSchema"
                        :facet-group="facetGroup"
                    />
                </template>
            </VListItemLazyIterator>
        </template>
        <template v-else>
            <VListSubheader v-if="hasBothUngroupedTypes">
                {{ t('resultVisualizer.referenceSummaryVisualiser.label.facetStatisticsSection') }}
            </VListSubheader>
            <VListItemLazyIterator
                v-if="hasUngroupedFacets"
                :items="ungroupedFacets"
                v-model:page="facetStatisticsResultsPage"
                :page-size="statisticsPageSize"
            >
                <template #item="{ item: facetStatistics }">
                    <FacetStatisticsVisualiser
                        :reference-schema="referenceStatistics.referenceSchema"
                        :facet-statistics="facetStatistics"
                    />
                </template>
            </VListItemLazyIterator>

            <VListSubheader v-if="hasBothUngroupedTypes">
                {{ t('resultVisualizer.referenceSummaryVisualiser.label.histogramStatisticsSection') }}
            </VListSubheader>
            <HistogramStatisticsVisualiser v-if="hasUngroupedHistograms" :histograms="ungroupedHistograms" />
        </template>
    </VList>
</template>

<style lang="scss" scoped>

</style>
