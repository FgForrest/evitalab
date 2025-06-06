<script setup lang="ts">
/**
 * Visualises raw JSON statistics of a single facet.
 */

import { computed, ComputedRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { Toaster, useToaster } from '@/modules/notification/service/Toaster'
import { ResultVisualiserService } from '@/modules/console/result-visualiser/service/ResultVisualiserService'
import { ReferenceSchema } from '@/modules/database-driver/request-response/schema/ReferenceSchema'
import { Result } from '@/modules/console/result-visualiser/model/Result'
import {
    VisualisedFacetStatistics
} from '@/modules/console/result-visualiser/model/facet-summary/VisualisedFacetStatistics'
import VMarkdown from '@/modules/base/component/VMarkdown.vue'
import { useQueryResult, useVisualiserService } from '@/modules/console/result-visualiser/component/dependencies'

const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<{
    referenceSchema: ReferenceSchema,
    facetStatisticsResult: Result,
    facetRepresentativeAttributes: string[]
}>()

const visualiserService: ResultVisualiserService = useVisualiserService()
const queryResult: ComputedRef<Result | undefined> = useQueryResult()

const facetStatistics = computed<VisualisedFacetStatistics | undefined>(() => {
    try {
        return visualiserService
            .getFacetSummaryService()
            .resolveFacetStatistics(queryResult.value!, props.facetStatisticsResult, props.facetRepresentativeAttributes)
    } catch (e: any) {
        toaster.error('Could not resolve facet statistics', e).then() // todo lho i18n
        return undefined
    }
})

async function copyPrimaryKey(): Promise<void> {
    if (facetStatistics.value?.primaryKey != undefined) {
        navigator.clipboard.writeText(`${facetStatistics.value?.primaryKey}`).then(() => {
            toaster.info(t('resultVisualizer.facetStatisticsVisualiser.notification.primaryKeyCopiedToClipboard')).then()
        }).catch(() => {
            toaster.error(t('common.notification.failedToCopyToClipboard')).then()
        })
    } else {
        await toaster.error(t('resultVisualizer.facetStatisticsVisualiser.notification.noPrimaryKeyProperty'))
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
                    <VMarkdown :source="t('resultVisualizer.facetStatisticsVisualiser.help.noRequestedProperty')" />
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
                        <VMarkdown :source="t('resultVisualizer.facetStatisticsVisualiser.help.noRepresentativeProperty')" />
                    </VTooltip>
                    <VTooltip v-if="facetStatistics?.impactMatchCount === 0" activator="parent">
                        {{ t('resultVisualizer.facetStatisticsVisualiser.help.zeroImpactMatchCount') }}
                    </VTooltip>
                </span>

                <VLazy>
                    <VChipGroup>
                        <VChip>
                            <div class="facet-title-counter">
                                <div class="facet-title-counter__section">
                                    <VIcon>mdi-set-right</VIcon>
                                    <span>{{ facetStatistics?.numberOfEntities ?? '-' }}&nbsp;/&nbsp;{{ facetStatistics?.impactDifference ?? '-' }}</span>
                                </div>
                                <div class="facet-title-counter__section">
                                    <VIcon>mdi-set-all</VIcon>
                                    <span>{{ facetStatistics?.impactMatchCount ?? '-' }}</span>
                                </div>
                                <div class="facet-title-counter__section">
                                    <VIcon>mdi-counter</VIcon>
                                    <span>{{ facetStatistics?.count ?? '-' }}</span>
                                </div>
                            </div>

                            <VTooltip activator="parent">
                                <VIcon>mdi-set-right</VIcon>
                                <br/>

                                <VMarkdown v-if="facetStatistics?.numberOfEntities == undefined" :source="t('resultVisualizer.facetStatisticsVisualiser.help.noTotalRecordCountProperty')" />
                                <span v-else>{{ t('resultVisualizer.facetStatisticsVisualiser.help.totalRecordCountProperty') }}</span>

                                <br/>

                                <VMarkdown v-if="facetStatistics?.impactDifference == undefined" :source="t('resultVisualizer.facetStatisticsVisualiser.help.noImpactDifferenceProperty')" />
                                <span v-else>{{ t('resultVisualizer.facetStatisticsVisualiser.help.impactDifferenceProperty') }}</span>

                                <br/>
                                <br/>

                                <VIcon>mdi-set-all</VIcon>
                                <br/>

                                <VMarkdown v-if="facetStatistics?.impactMatchCount == undefined" :source="t('resultVisualizer.facetStatisticsVisualiser.help.noImpactMatchProperty')" />
                                <span v-else>{{ t('resultVisualizer.facetStatisticsVisualiser.help.impactMatchProperty') }}</span>

                                <br/>
                                <br/>

                                <VIcon>mdi-counter</VIcon>
                                <br/>

                                <VMarkdown v-if="facetStatistics?.count == undefined" :source="t('resultVisualizer.facetStatisticsVisualiser.help.noCountProperty')" />
                                <span v-else>{{ t('resultVisualizer.facetStatisticsVisualiser.help.countProperty') }}</span>
                            </VTooltip>
                        </VChip>

                        <VChip v-if="!referenceSchema.referencedEntityTypeManaged" prepend-icon="mdi-open-in-new">
                            {{ t('resultVisualizer.facetStatisticsVisualiser.label.externalReference') }}
                            <VTooltip activator="parent">
                                {{ t('resultVisualizer.facetStatisticsVisualiser.help.externalReference') }}
                            </VTooltip>
                        </VChip>
                    </VChipGroup>
                </VLazy>
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

.facet-title-counter {
    display: flex;
    column-gap: 0.625rem;
    align-items: center;

    &__section {
        display: flex;
        column-gap: 0.25rem;
        align-items: center;
    }
}
</style>
