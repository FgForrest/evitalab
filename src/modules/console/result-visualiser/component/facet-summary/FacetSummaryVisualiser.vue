<script setup lang="ts">
/**
 * Visualises raw JSON facet summary.
 */

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Toaster, useToaster } from '@/modules/notification/service/Toaster'
import { CatalogPointer } from '@/modules/connection/model/CatalogPointer'
import { ResultVisualiserService } from '@/modules/console/result-visualiser/service/ResultVisualiserService'
import { Result } from '@/modules/console/result-visualiser/model/Result'
import { EntitySchema } from '@/modules/connection/model/schema/EntitySchema'
import { ReferenceSchema } from '@/modules/connection/model/schema/ReferenceSchema'
import ReferenceFacetGroupStatisticsVisualiser
    from '@/modules/console/result-visualiser/component/facet-summary/ReferenceFacetGroupStatisticsVisualiser.vue'
import { List } from 'immutable'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import VMissingDataIndicator from '@/modules/base/component/VMissingDataIndicator.vue'

const toaster: Toaster = useToaster()
const { t } = useI18n()

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

function getCountForReference(referenceSchema: ReferenceSchema, groupStatisticsResults: Result): number {
    let results: any
    if (referenceSchema.referencedGroupType.getIfSupported()! != undefined) {
        results = groupStatisticsResults

    } else {
        results = props.visualiserService
            .getFacetSummaryService()
            .findFacetStatisticsResults(groupStatisticsResults[0])
    }
    if (results instanceof Array) {
        return results.length
    } else if (results instanceof List) {
        return (results as List<any>).size
    } else {
        throw new UnexpectedError('Expected array or list of items')
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
                <ReferenceFacetGroupStatisticsVisualiser
                    :catalog-pointer="catalogPointer"
                    :visualiser-service="visualiserService"
                    :query-result="queryResult"
                    :reference-schema="referenceWithGroup[0]"
                    :group-statistics-results="referenceWithGroup[1]"
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
