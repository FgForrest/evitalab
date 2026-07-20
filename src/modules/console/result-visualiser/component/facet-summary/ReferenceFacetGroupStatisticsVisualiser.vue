<script setup lang="ts">
/**
 * Visualises facet group statistics for a single reference. Renders grouped facets with
 * expandable group headers or flat facet lists for ungrouped references.
 */
import { computed, ref } from 'vue'
import { VisualisedReferenceFacets } from '@/modules/console/result-visualiser/model/facet-summary/VisualisedFacetSummary'
import { VisualisedFacetStatistics } from '@/modules/console/result-visualiser/model/facet-summary/VisualisedFacetStatistics'
import VListItemLazyIterator from '@/modules/base/component/VListItemLazyIterator.vue'
import FacetGroupStatisticsVisualiser
    from '@/modules/console/result-visualiser/component/facet-summary/FacetGroupStatisticsVisualiser.vue'
import FacetStatisticsVisualiser
    from '@/modules/console/result-visualiser/component/facet-summary/FacetStatisticsVisualiser.vue'

const statisticsPageSize: number = 10

const props = defineProps<{
    referenceFacets: VisualisedReferenceFacets
}>()

const groupStatisticsResultsPage = ref<number>(1)

const isGroupedFacets = computed<boolean>(() => {
    return props.referenceFacets.referenceSchema.referencedGroupType != undefined
})

const ungroupedFacets = computed<VisualisedFacetStatistics[]>(() => {
    if (isGroupedFacets.value) return []
    const firstGroup = props.referenceFacets.groups[0]
    if (firstGroup == undefined) return []
    return firstGroup.facets
})
const facetStatisticsResultsPage = ref<number>(1)
</script>

<template>
    <VList density="compact">
        <template v-if="isGroupedFacets">
            <VListItemLazyIterator
                :items="referenceFacets.groups"
                v-model:page="groupStatisticsResultsPage"
                :page-size="statisticsPageSize"
            >
                <template #item="{ item: facetGroup }">
                    <FacetGroupStatisticsVisualiser
                        :reference-schema="referenceFacets.referenceSchema"
                        :facet-group="facetGroup"
                    />
                </template>
            </VListItemLazyIterator>
        </template>
        <template v-else>
            <VListItemLazyIterator
                :items="ungroupedFacets"
                v-model:page="facetStatisticsResultsPage"
                :page-size="statisticsPageSize"
            >
                <template #item="{ item: facetStatistics }">
                    <FacetStatisticsVisualiser
                        :reference-schema="referenceFacets.referenceSchema"
                        :facet-statistics="facetStatistics"
                    />
                </template>
            </VListItemLazyIterator>
        </template>
    </VList>
</template>

<style lang="scss" scoped>

</style>
