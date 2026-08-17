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
                        <span class="group-title__identity">
                            <span
                                v-if="facetGroup.groupStatistics.primaryKey != undefined"
                                class="text-disabled d-flex align-center"
                                @click.stop="copyPrimaryKey"
                            >
                                 <VIcon size="20" class="mr-1">mdi-key</VIcon>
                                {{ facetGroup.groupStatistics.primaryKey }}{{ facetGroup.groupStatistics.title ? ':' : '' }}
                            </span>
                            <span class="group-title__name">
                                {{ facetGroup.groupStatistics.title ?? 'Unknown' }}
                                <VTooltip v-if="!facetGroup.groupStatistics.title" activator="parent">
                                    <VMarkdown :source="t('resultVisualizer.facetStatisticsVisualiser.help.noPrimaryKeyProperty')" />
                                </VTooltip>
                            </span>
                        </span>

                        <VLazy class="group-title__chips">
                            <VChipGroup column>
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
    flex-wrap: wrap;
    column-gap: 0.5rem;
    row-gap: 0.25rem;
    align-items: center;

    // primary key and name shrink as one unit, so that a name too long for the row truncates instead of
    // dropping onto a line of its own below its own primary key
    &__identity {
        display: flex;
        flex: 0 1 auto;
        min-width: 0;
        column-gap: 0.5rem;
        align-items: center;
    }

    // `display: flex` here voids the ellipsis Vuetify puts on `.v-list-item-title`, so the name
    // truncates on its own; `min-width` must be reset because the automatic minimum size of a flex item
    // is its content, which would clip the text instead of shortening it
    &__name {
        flex: 0 1 auto;
        min-width: 0;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }

    // the chips keep their width and move to a line of their own instead of being cut; `column` wraps
    // them there rather than letting them slide out of sight in the group's scrollbar-less scroller
    &__chips {
        flex: 0 0 auto;
        max-width: 100%;

        // `column` also sets `white-space: normal` on the group: without this, a chip's own label wraps
        // and is cut by the chip's height, and the shrinking chips - not the group - absorb the squeeze
        :deep(.v-chip) {
            flex: 0 0 auto;
            white-space: nowrap;
        }
    }

}

.histogram-panels {
    padding-inline-start: calc(16px + var(--indent-padding));
}
</style>
