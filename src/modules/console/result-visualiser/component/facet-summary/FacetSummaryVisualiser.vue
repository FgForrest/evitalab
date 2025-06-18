<script setup lang="ts">
/**
 * Visualises raw JSON facet summary.
 */

import { computed } from 'vue'
import type { Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToaster } from '@/modules/notification/service/Toaster'
import type { Toaster } from '@/modules/notification/service/Toaster'
import { ResultVisualiserService } from '@/modules/console/result-visualiser/service/ResultVisualiserService'
import type { Result } from '@/modules/console/result-visualiser/model/Result'
import { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'
import { ReferenceSchema } from '@/modules/database-driver/request-response/schema/ReferenceSchema'
import ReferenceFacetGroupStatisticsVisualiser
    from '@/modules/console/result-visualiser/component/facet-summary/ReferenceFacetGroupStatisticsVisualiser.vue'
import { List } from 'immutable'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import VMissingDataIndicator from '@/modules/base/component/VMissingDataIndicator.vue'
import { useRootEntitySchema, useVisualiserService } from '@/modules/console/result-visualiser/component/dependencies'

const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<{
    facetSummaryResult: Result,
}>()

const visualiserService: ResultVisualiserService = useVisualiserService()
const entitySchema: Ref<EntitySchema | undefined> = useRootEntitySchema()

const referencesWithGroupStatisticsResults = computed<[ReferenceSchema, Result[]][]>(() => {
    try {
        return visualiserService
            .getFacetSummaryService()
            .findFacetGroupStatisticsByReferencesResults(props.facetSummaryResult, entitySchema.value!)
    } catch (e: any) {
        toaster.error('Could not find facet group statistics results', e).then() // todo lho i18n
        return []
    }
})

function getCountForReference(referenceSchema: ReferenceSchema, groupStatisticsResults: Result): number {
    let results: any
    if (referenceSchema.referencedGroupType != undefined) {
        results = groupStatisticsResults

    } else {
        results = visualiserService
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
