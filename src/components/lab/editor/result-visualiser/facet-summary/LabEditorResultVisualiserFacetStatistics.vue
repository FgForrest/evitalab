<script setup lang="ts">
/**
 * Visualises raw JSON statistics of a single facet.
 */

import { computed } from 'vue'
import VMarkdown from '@/components/base/VMarkdown.vue'
import { UnexpectedError } from '@/model/lab'
import { Toaster, useToaster } from '@/services/editor/toaster'
import { ResultVisualiserService } from '@/services/editor/result-visualiser/result-visualiser.service'
import { Result, VisualisedFacetStatistics } from '@/model/editor/result-visualiser'

const toaster: Toaster = useToaster()

const props = defineProps<{
    visualiserService: ResultVisualiserService,
    queryResult: Result
    facetStatisticsResult: Result,
    facetRepresentativeAttributes: string[]
}>()

const facetStatistics = computed<VisualisedFacetStatistics | undefined>(() => {
    try {
        return props.visualiserService
            .getFacetSummaryService()
            .resolveFacetStatistics(props.queryResult, props.facetStatisticsResult, props.facetRepresentativeAttributes)
    } catch (e: any) {
        toaster.error(e)
        return undefined
    }
})

function copyPrimaryKey(): void {
    if (facetStatistics.value?.primaryKey != undefined) {
        navigator.clipboard.writeText(`${facetStatistics.value?.primaryKey}`).then(() => {
            toaster.info('Primary key copied to clipboard.')
        }).catch(() => {
            toaster.error(new UnexpectedError(undefined, 'Failed to copy to clipboard.'))
        })
    } else {
        toaster.error('No primary key property was fetched.')
    }
}
</script>

<template>
    <VListItem>
        <template #prepend>
            <VCheckboxBtn
                :model-value="facetStatistics?.requested || false"
                readonly
                :false-icon="facetStatistics?.impactMatchCount === 0 ? 'mdi-checkbox-blank-off-outline' : 'mdi-checkbox-blank-outline'"
                :class="{ 'text-red': facetStatistics?.requested == undefined, 'facet-checkbox--disabled': facetStatistics?.impactMatchCount === 0 }"
            >
                <VTooltip v-if="facetStatistics?.requested == undefined" activator="parent">
                    <VMarkdown source="The `requested` property was not fetched." />
                </VTooltip>
            </VCheckboxBtn>
        </template>

        <template #title>
            <VListItemTitle class="facet-title">
                <span
                    v-if="facetStatistics?.primaryKey != undefined"
                    class="text-disabled d-flex align-center"
                    style="cursor: pointer;"
                    @click.stop="copyPrimaryKey"
                >
                    <VIcon size="20" class="mr-1">mdi-key</VIcon>
                    {{ facetStatistics?.primaryKey }}{{ facetStatistics?.title ? ':' : '' }}
                </span>
                <span :class="{ 'text-disabled': facetStatistics?.impactMatchCount === 0 }">
                    {{ facetStatistics?.title || 'Unknown' }}
                    <VTooltip v-if="!facetStatistics?.title" activator="parent">
                        <VMarkdown source="No `primaryKey` property or representative attributes were fetched." />
                    </VTooltip>
                    <VTooltip v-if="facetStatistics?.impactMatchCount === 0" activator="parent">
                        <!-- todo jno review explanation -->
                        No entities would be returned if this facet was requested because no entity has combination of
                        already requested facets plus this one.
                    </VTooltip>
                </span>

                <VChipGroup>
                    <VChip prepend-icon="mdi-numeric-positive-1">
                        <span>
                            {{ facetStatistics?.numberOfEntities ?? '-' }}
                            <VTooltip activator="parent">
                                <VMarkdown v-if="facetStatistics?.numberOfEntities == undefined" source="The `totalRecordCount` property was not found in neither `recordPage` nor `recordStrip`." />
                                <!-- todo jno review explanation -->
                                <span v-else>The total number of entities matching the user filter.</span>
                            </VTooltip>
                        </span>
                        <span>&nbsp;/&nbsp;</span>
                        <span>
                            {{ facetStatistics?.impactDifference ?? '-' }}
                            <VTooltip activator="parent">
                                <VMarkdown v-if="facetStatistics?.impactDifference == undefined" source="The `impact.difference` property was not found." />
                                <!-- todo jno review explanation -->
                                <span v-else>The difference from the current number of entities matching the user filter if this facet was requested.</span>
                            </VTooltip>
                        </span>
                    </VChip>

                    <VChip prepend-icon="mdi-set-none">
                        {{ facetStatistics?.impactMatchCount ?? '-' }}
                        <VTooltip activator="parent">
                            <VMarkdown v-if="facetStatistics?.impactMatchCount == undefined" source="The `impact.matchCount` property was not found." />
                            <!-- todo jno review explanation -->
                            <span v-else>The total number of entities matching the user filter if this facet was requested.</span>
                        </VTooltip>
                    </VChip>

                    <VChip prepend-icon="mdi-counter">
                        {{ facetStatistics?.count ?? '-' }}
                        <VTooltip activator="parent">
                            <VMarkdown v-if="facetStatistics?.count == undefined" source="The `count` property was not found." />
                            <!-- todo jno review explanation -->
                            <span v-else>The total number of entities matching this facet without the user filter.</span>
                        </VTooltip>
                    </VChip>
                </VChipGroup>
            </VListItemTitle>
        </template>
    </VListItem>
</template>

<style lang="scss" scoped>
// todo lho better handling for small widths
.facet-title {
    display: flex;
    column-gap: 0.5rem;
    align-items: center;
    flex-wrap: wrap;
}

.facet-checkbox--disabled {
    opacity: var(--v-disabled-opacity)
}
</style>
