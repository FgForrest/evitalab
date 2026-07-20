<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToaster } from '@/modules/notification/service/Toaster'
import type { Toaster } from '@/modules/notification/service/Toaster'
import { ReferenceSchema } from '@/modules/database-driver/request-response/schema/ReferenceSchema'
import { VisualisedReferenceGroup } from '@/modules/console/result-visualiser/model/reference-summary/VisualisedReferenceSummary'
import VMarkdown from '@/modules/base/component/VMarkdown.vue'
import VListItemLazyIterator from '@/modules/base/component/VListItemLazyIterator.vue'
import FacetStatisticsVisualiser
    from '@/modules/console/result-visualiser/component/reference-summary/FacetStatisticsVisualiser.vue'
import HistogramStatisticsVisualiser
    from '@/modules/console/result-visualiser/component/reference-summary/HistogramStatisticsVisualiser.vue'
import { copyToClipboard } from '@/utils/clipboard'

const facetStatisticsPageSize: number = 10

const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<{
    referenceSchema: ReferenceSchema
    facetGroup: VisualisedReferenceGroup
}>()

const facetStatisticsInitialized = ref<boolean>(false)
const facetStatisticsResultsPage = ref<number>(1)

const hasFacets = computed<boolean>(() => props.facetGroup.facets.length > 0)
const hasHistograms = computed<boolean>(() => props.facetGroup.histograms.length > 0)
const hasBothTypes = computed<boolean>(() => hasFacets.value && hasHistograms.value)

function initializeFacets(): void {
    facetStatisticsInitialized.value = !facetStatisticsInitialized.value
}

async function copyPrimaryKey(): Promise<void> {
    if (props.facetGroup.groupStatistics.primaryKey != undefined) {
        copyToClipboard(`${props.facetGroup.groupStatistics.primaryKey}`).then(() => {
            toaster.info(t('resultVisualizer.facetStatisticsVisualiser.notification.primaryKeyCopiedToClipboard')).then()
        }).catch(() => {
            toaster.error(t('common.notification.failedToCopyToClipboard')).then()
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
                            v-if="facetGroup.groupStatistics.primaryKey != undefined"
                            class="text-disabled d-flex align-center"
                            @click.stop="copyPrimaryKey"
                        >
                             <VIcon size="20" class="mr-1">mdi-key</VIcon>
                            {{ facetGroup.groupStatistics.primaryKey }}{{ facetGroup.groupStatistics.title ? ':' : '' }}
                        </span>
                        <span>
                            {{ facetGroup.groupStatistics.title ?? 'Unknown' }}
                            <VTooltip v-if="!facetGroup.groupStatistics.title" activator="parent">
                                <VMarkdown :source="t('resultVisualizer.facetStatisticsVisualiser.help.noPrimaryKeyProperty')" />
                            </VTooltip>
                        </span>

                        <VLazy>
                            <VChipGroup>
                                <VChip v-if="hasFacets" prepend-icon="mdi-counter">
                                    <span>
                                        {{ facetGroup.groupStatistics.count ?? '-' }}
                                        <VTooltip activator="parent">
                                            <VMarkdown v-if="facetGroup.groupStatistics.count == undefined" :source="t('resultVisualizer.facetStatisticsVisualiser.help.noGroupCountProperty')" />
                                            <span v-else>{{ t('resultVisualizer.facetStatisticsVisualiser.help.groupCountProperty') }}</span>
                                        </VTooltip>
                                    </span>
                                </VChip>
                                <VChip v-if="hasHistograms" prepend-icon="mdi-chart-bar">
                                    <span>
                                        {{ facetGroup.histograms.length }}
                                        <VTooltip activator="parent">
                                            {{ t('resultVisualizer.referenceSummaryVisualiser.help.histogramIndexCount') }}
                                        </VTooltip>
                                    </span>
                                </VChip>
                                <VChip v-if="!referenceSchema.referencedGroupTypeManaged" prepend-icon="mdi-open-in-new">
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
            <VListSubheader v-if="hasBothTypes">
                {{ t('resultVisualizer.referenceSummaryVisualiser.label.facetStatisticsSection') }}
            </VListSubheader>
            <VListItemLazyIterator
                v-if="hasFacets"
                :items="facetGroup.facets"
                v-model:page="facetStatisticsResultsPage"
                :page-size="facetStatisticsPageSize"
            >
                <template #item="{ item: facetStatistics }">
                    <FacetStatisticsVisualiser
                        :reference-schema="referenceSchema"
                        :facet-statistics="facetStatistics"
                    />
                </template>
            </VListItemLazyIterator>

            <VListSubheader v-if="hasBothTypes">
                {{ t('resultVisualizer.referenceSummaryVisualiser.label.histogramStatisticsSection') }}
            </VListSubheader>
            <div v-if="hasHistograms" class="histogram-panels">
                <HistogramStatisticsVisualiser :histograms="facetGroup.histograms" />
            </div>
        </template>
    </VListGroup>
</template>

<style lang="scss" scoped>
.group-title {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}

.histogram-panels {
    padding-inline-start: calc(16px + var(--indent-padding));
}
</style>
