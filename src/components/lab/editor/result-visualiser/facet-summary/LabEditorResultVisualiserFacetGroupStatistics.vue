<script setup lang="ts">
/**
 * Visualises raw JSON statistics of a single facet group.
 */

import { computed, ref } from 'vue'
import VMarkdown from '@/components/base/VMarkdown.vue'
import { UnexpectedError } from '@/model/lab'
import { Toaster, useToaster } from '@/services/editor/toaster'
import LabEditorResultVisualiserFacetStatistics
    from '@/components/lab/editor/result-visualiser/facet-summary/LabEditorResultVisualiserFacetStatistics.vue'
import { ResultVisualiserService } from '@/services/editor/result-visualiser/result-visualiser.service'
import { Result, VisualisedFacetGroupStatistics } from '@/model/editor/result-visualiser'

const toaster: Toaster = useToaster()

const props = defineProps<{
    visualiserService: ResultVisualiserService,
    queryResult: Result,
    groupStatisticsResult: Result | undefined,
    groupRepresentativeAttributes: string[],
    facetRepresentativeAttributes: string[]
}>()

const groupStatistics = computed<VisualisedFacetGroupStatistics | undefined>(() => {
    if (props.groupStatisticsResult == undefined) {
        return undefined
    }
    try {
        return props.visualiserService
            .getFacetSummaryService()
            .resolveFacetGroupStatistics(props.groupStatisticsResult, props.groupRepresentativeAttributes)
    } catch (e: any) {
        toaster.error(e)
        return undefined
    }
})

const facetStatisticsInitialized = ref<boolean>(false)
const facetStatisticsResults = computed<Result[]>(() => {
    if (props.groupStatisticsResult == undefined || !facetStatisticsInitialized.value) {
        return []
    }
    try {
        return props.visualiserService
            .getFacetSummaryService()
            .findFacetStatisticsResults(props.groupStatisticsResult)
    } catch (e: any) {
        toaster.error(e)
        return []
    }
})


function initializeFacets(): void {
    // todo lho this makes quick hide of the facet group, it looks weird
    facetStatisticsInitialized.value = !facetStatisticsInitialized.value
}

function copyPrimaryKey(): void {
    if (groupStatistics.value?.primaryKey != undefined) {
        navigator.clipboard.writeText(`${groupStatistics.value?.primaryKey}`).then(() => {
            toaster.info('Primary key copied to clipboard.')
        }).catch(() => {
            toaster.error(new UnexpectedError(undefined, 'Failed to copy to clipboard.'))
        })
    }
}

</script>

<template>
    <VListGroup>
        <template #activator="{ props }">
            <VListItem v-bind="props" @click="initializeFacets">
                <VListItemTitle class="group-title">
                    <span
                        v-if="groupStatistics?.primaryKey != undefined"
                        class="text-disabled d-flex align-center"
                        @click.stop="copyPrimaryKey"
                    >
                         <VIcon size="20" class="mr-1">mdi-key</VIcon>
                        {{ groupStatistics?.primaryKey }}{{ groupStatistics?.title ? ':' : '' }}
                    </span>
                    <span>
                        {{ groupStatistics?.title ?? 'Unknown' }}
                        <VTooltip v-if="!groupStatistics?.title" activator="parent">
                            <VMarkdown source="No `primaryKey` property or representative attributes were fetched." />
                        </VTooltip>
                    </span>

                    <VChipGroup>
                        <VChip prepend-icon="mdi-counter">
                            <span>
                                {{ groupStatistics?.count ?? '-' }}
                                <VTooltip activator="parent">
                                    <VMarkdown v-if="groupStatistics?.count == undefined" source="No `count` property was fetched." />
                                    <!-- todo jno review explanation -->
                                    <span v-else>The total number of entities matching any facet from this group without user filter.</span>
                                </VTooltip>
                            </span>
                        </VChip>
                    </VChipGroup>
                </VListItemTitle>
            </VListItem>
        </template>

        <template v-if="facetStatisticsInitialized">
            <LabEditorResultVisualiserFacetStatistics
                v-for="(facetStatisticsResult, index) in facetStatisticsResults"
                :key="index"
                :visualiser-service="visualiserService"
                :query-result="queryResult"
                :facet-statistics-result="facetStatisticsResult"
                :facet-representative-attributes="facetRepresentativeAttributes"
            />
        </template>
    </VListGroup>
</template>

<style lang="scss" scoped>
// todo lho better handling for small widths
.group-title {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}
</style>
