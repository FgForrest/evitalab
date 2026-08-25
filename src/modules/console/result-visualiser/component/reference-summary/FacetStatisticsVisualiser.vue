<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useToaster } from '@/modules/notification/service/Toaster'
import type { Toaster } from '@/modules/notification/service/Toaster'
import { ReferenceSchema } from '@/modules/database-driver/request-response/schema/ReferenceSchema'
import {
    VisualisedFacetStatistics
} from '@/modules/console/result-visualiser/model/reference-summary/VisualisedFacetStatistics'
import VMarkdown from '@/modules/base/component/VMarkdown.vue'
import { copyToClipboard } from '@/utils/clipboard'

const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<{
    referenceSchema: ReferenceSchema,
    facetStatistics: VisualisedFacetStatistics
}>()

async function copyPrimaryKey(): Promise<void> {
    if (props.facetStatistics.primaryKey != undefined) {
        copyToClipboard(`${props.facetStatistics.primaryKey}`).then(() => {
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
                :model-value="facetStatistics.requested || false"
                readonly
                :false-icon="facetStatistics.impactMatchCount === 0 ? 'mdi-checkbox-blank-off-outline' : 'mdi-checkbox-blank-outline'"
                :class="{ 'text-red': facetStatistics.requested == undefined, 'facet-checkbox--disabled': facetStatistics.impactMatchCount === 0 }"
            >
                <VTooltip v-if="facetStatistics.requested == undefined" activator="parent">
                    <VMarkdown :source="t('resultVisualizer.facetStatisticsVisualiser.help.noRequestedProperty')" />
                </VTooltip>
            </VCheckboxBtn>
        </template>

        <template #title>
            <VListItemTitle class="facet-title">
                <span class="facet-title__identity">
                    <span
                        v-if="facetStatistics.primaryKey != undefined"
                        class="text-disabled d-flex align-center"
                        style="cursor: pointer;"
                        @click.stop="copyPrimaryKey"
                    >
                        <VIcon size="20" class="mr-1">mdi-key</VIcon>
                        {{ facetStatistics.primaryKey }}{{ facetStatistics.title ? ':' : '' }}
                    </span>
                    <span :class="['facet-title__name', { 'text-disabled': facetStatistics.impactMatchCount === 0 }]">
                        {{ facetStatistics.title || 'Unknown' }}
                        <VTooltip v-if="!facetStatistics.title" activator="parent">
                            <VMarkdown :source="t('resultVisualizer.facetStatisticsVisualiser.help.noRepresentativeProperty')" />
                        </VTooltip>
                        <VTooltip v-if="facetStatistics.impactMatchCount === 0" activator="parent">
                            {{ t('resultVisualizer.facetStatisticsVisualiser.help.zeroImpactMatchCount') }}
                        </VTooltip>
                    </span>
                </span>

                <VLazy class="facet-title__chips">
                    <VChipGroup column>
                        <VChip>
                            <div class="facet-title-counter">
                                <div class="facet-title-counter__section">
                                    <VIcon>mdi-set-right</VIcon>
                                    <span>{{ facetStatistics.numberOfEntities ?? '-' }}&nbsp;/&nbsp;{{ facetStatistics.impactDifference ?? '-' }}</span>
                                </div>
                                <div class="facet-title-counter__section">
                                    <VIcon>mdi-set-all</VIcon>
                                    <span>{{ facetStatistics.impactMatchCount ?? '-' }}</span>
                                </div>
                                <div class="facet-title-counter__section">
                                    <VIcon>mdi-counter</VIcon>
                                    <span>{{ facetStatistics.count ?? '-' }}</span>
                                </div>
                            </div>

                            <VTooltip activator="parent">
                                <VIcon>mdi-set-right</VIcon>
                                <br/>

                                <VMarkdown v-if="facetStatistics.numberOfEntities == undefined" :source="t('resultVisualizer.facetStatisticsVisualiser.help.noTotalRecordCountProperty')" />
                                <span v-else>{{ t('resultVisualizer.facetStatisticsVisualiser.help.totalRecordCountProperty') }}</span>

                                <br/>

                                <VMarkdown v-if="facetStatistics.impactDifference == undefined" :source="t('resultVisualizer.facetStatisticsVisualiser.help.noImpactDifferenceProperty')" />
                                <span v-else>{{ t('resultVisualizer.facetStatisticsVisualiser.help.impactDifferenceProperty') }}</span>

                                <br/>
                                <br/>

                                <VIcon>mdi-set-all</VIcon>
                                <br/>

                                <VMarkdown v-if="facetStatistics.impactMatchCount == undefined" :source="t('resultVisualizer.facetStatisticsVisualiser.help.noImpactMatchProperty')" />
                                <span v-else>{{ t('resultVisualizer.facetStatisticsVisualiser.help.impactMatchProperty') }}</span>

                                <br/>
                                <br/>

                                <VIcon>mdi-counter</VIcon>
                                <br/>

                                <VMarkdown v-if="facetStatistics.count == undefined" :source="t('resultVisualizer.facetStatisticsVisualiser.help.noCountProperty')" />
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
.facet-title {
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
            // the counter chip below holds three sections and can outgrow the row; it gains height
            // instead of having its last section cut off, while plain chips keep their default size
            height: auto;
            min-height: 2rem;
        }
    }

}

.facet-checkbox--disabled {
    opacity: var(--v-disabled-opacity)
}

.facet-title-counter {
    display: flex;
    flex-wrap: wrap;
    column-gap: 0.625rem;
    row-gap: 0.125rem;
    align-items: center;

    &__section {
        display: flex;
        column-gap: 0.25rem;
        align-items: center;
    }
}
</style>
