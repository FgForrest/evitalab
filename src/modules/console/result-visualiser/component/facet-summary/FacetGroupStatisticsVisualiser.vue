<script setup lang="ts">
/**
 * Visualises raw JSON statistics of a single facet group.
 */

import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Toaster, useToaster } from '@/modules/notification/service/Toaster'
import { ResultVisualiserService } from '@/modules/console/result-visualiser/service/ResultVisualiserService'
import { ReferenceSchema } from '@/modules/connection/model/schema/ReferenceSchema'
import { Result } from '@/modules/console/result-visualiser/model/Result'
import {
    VisualisedFacetGroupStatistics
} from '@/modules/console/result-visualiser/model/facet-summary/VisualisedFacetGroupStatistics'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import VMarkdown from '@/modules/base/component/VMarkdown.vue'
import VListItemLazyIterator from '@/modules/base/component/VListItemLazyIterator.vue'
import FacetStatisticsVisualiser
    from '@/modules/console/result-visualiser/component/facet-summary/FacetStatisticsVisualiser.vue'

const facetStatisticsPageSize: number = 10

const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<{
    visualiserService: ResultVisualiserService,
    referenceSchema: ReferenceSchema
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
const facetStatisticsResultsPage = ref<number>(1)

function initializeFacets(): void {
    // todo lho this makes quick hide of the facet group, it looks weird
    facetStatisticsInitialized.value = !facetStatisticsInitialized.value
}

function copyPrimaryKey(): void {
    if (groupStatistics.value?.primaryKey != undefined) {
        navigator.clipboard.writeText(`${groupStatistics.value?.primaryKey}`).then(() => {
            toaster.info(t('resultVisualizer.facetStatisticsVisualiser.notification.primaryKeyCopiedToClipboard'))
        }).catch(() => {
            toaster.error(new UnexpectedError(t('common.notification.failedToCopyToClipboard')))
        })
    }
}

</script>

<template>
    <VListGroup>
        <template #activator="{ props }">
            <VListItem v-bind="props" @click="initializeFacets">
                <template #prepend>
                    <VIcon>mdi-format-list-group</VIcon>
                </template>
                <template #title>
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
                                <VMarkdown :source="t('resultVisualizer.facetStatisticsVisualiser.help.noPrimaryKeyProperty')" />
                            </VTooltip>
                        </span>

                        <VLazy>
                            <VChipGroup>
                                <VChip prepend-icon="mdi-counter">
                                    <span>
                                        {{ groupStatistics?.count ?? '-' }}
                                        <VTooltip activator="parent">
                                            <VMarkdown v-if="groupStatistics?.count == undefined" :source="t('resultVisualizer.facetStatisticsVisualiser.help.noGroupCountProperty')" />
                                            <span v-else>{{ t('resultVisualizer.facetStatisticsVisualiser.help.groupCountProperty') }}</span>
                                        </VTooltip>
                                    </span>
                                </VChip>
                                <VChip v-if="!referenceSchema.referencedGroupTypeManaged.getOrElse(false)" prepend-icon="mdi-open-in-new">
                                    {{ t('resultVisualizer.facetStatisticsVisualiser.label.externalGroup') }}
                                    <VTooltip activator="parent">
                                        {{ t('resultVisualizer.facetStatisticsVisualiser.help.externalGroup') }}
                                    </VTooltip>
                                </VChip>
                            </VChipGroup>
                        </VLazy>
                    </VListItemTitle>
                </template>
            </VListItem>
        </template>

        <template v-if="facetStatisticsInitialized">
            <VListItemLazyIterator
                :items="facetStatisticsResults"
                v-model:page="facetStatisticsResultsPage"
                :page-size="facetStatisticsPageSize"
            >
                <template #item="{ item: facetStatisticsResult }">
                    <FacetStatisticsVisualiser
                        :visualiser-service="visualiserService"
                        :reference-schema="referenceSchema"
                        :query-result="queryResult"
                        :facet-statistics-result="facetStatisticsResult"
                        :facet-representative-attributes="facetRepresentativeAttributes"
                    />
                </template>
            </VListItemLazyIterator>
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
