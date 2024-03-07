<script setup lang="ts">
/**
 * Visualises raw JSON facet summary.
 */

import { EntitySchema, ReferenceSchema } from '@/model/evitadb'
import { computed } from 'vue'
import { Toaster, useToaster } from '@/services/editor/toaster'
import LabEditorResultVisualiserMissingDataIndicator
    from '@/components/lab/editor/result-visualiser/LabEditorResultVisualiserMissingDataIndicator.vue'
import LabEditorResultVisualiserReferenceFacetGroupStatistics
    from '@/components/lab/editor/result-visualiser/facet-summary/LabEditorResultVisualiserReferenceFacetGroupStatistics.vue'
import { ResultVisualiserService } from '@/services/editor/result-visualiser/result-visualiser.service'
import { Result } from '@/model/editor/result-visualiser'
import { CatalogPointer } from '@/model/editor/tab/CatalogPointer'

const toaster: Toaster = useToaster()

const props = defineProps<{
    catalogPointer: CatalogPointer,
    visualiserService: ResultVisualiserService,
    queryResult: Result,
    facetSummaryResult: Result,
    entitySchema: EntitySchema,
}>()

const referencesWithGroupStatisticsResults = computed<[ReferenceSchema, Result[]][]>(() => {
    try {
        return props.visualiserService
            .getFacetSummaryService()
            .findFacetGroupStatisticsByReferencesResults(props.facetSummaryResult, props.entitySchema)
    } catch (e: any) {
        toaster.error(e.message)
        return []
    }
})

function getCountForReference(referenceSchema: ReferenceSchema, groupStatisticsResults: Result[]): number {
    if (referenceSchema.referencedGroupType != undefined) {
        return groupStatisticsResults.length
    } else {
        return props.visualiserService
            .getFacetSummaryService()
            .findFacetStatisticsResults(groupStatisticsResults[0])
            .length
    }
}
</script>

<template>
    <VExpansionPanels v-if="referencesWithGroupStatisticsResults && referencesWithGroupStatisticsResults.length > 0">
        <VExpansionPanel v-for="referenceWithGroup in referencesWithGroupStatisticsResults" :key="referenceWithGroup[0].name">
            <VExpansionPanelTitle>
                <VIcon class="mr-8">mdi-link-variant</VIcon>
                {{ referenceWithGroup[0].name }} ({{ getCountForReference(referenceWithGroup[0], referenceWithGroup[1]) }})
            </VExpansionPanelTitle>
            <VExpansionPanelText>
                <LabEditorResultVisualiserReferenceFacetGroupStatistics
                    :catalog-pointer="catalogPointer"
                    :visualiser-service="visualiserService"
                    :query-result="queryResult"
                    :reference-schema="referenceWithGroup[0]"
                    :group-statistics-results="referenceWithGroup[1]"
                />
            </VExpansionPanelText>
        </VExpansionPanel>
    </VExpansionPanels>

    <LabEditorResultVisualiserMissingDataIndicator
        v-else
        icon="mdi-text-search"
        title="No facet summary groups found."
    />
</template>

<style lang="scss" scoped>

</style>
