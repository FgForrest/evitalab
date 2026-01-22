<script setup lang="ts">
/**
 * Visualises the raw JSON attribute histograms.
 */

import { computed } from 'vue'
import type { Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToaster } from '@/modules/notification/service/Toaster'
import type { Toaster } from '@/modules/notification/service/Toaster'
import { ResultVisualiserService } from '@/modules/console/result-visualiser/service/ResultVisualiserService'
import type { Result } from '@/modules/console/result-visualiser/model/Result'
import { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'
import { AttributeSchema } from '@/modules/database-driver/request-response/schema/AttributeSchema'
import { VisualisedHistogram } from '@/modules/console/result-visualiser/model/histogram/VisualisedHistogram'
import HistogramVisualiser from '@/modules/console/result-visualiser/component/histogram/HistogramVisualiser.vue'
import VMissingDataIndicator from '@/modules/base/component/VMissingDataIndicator.vue'
import { useRootEntitySchema, useVisualiserService } from '@/modules/console/result-visualiser/component/dependencies'

const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<{
    attributeHistogramsResult: Result,
}>()

const visualiserService: ResultVisualiserService = useVisualiserService()
const rootEntitySchema: Ref<EntitySchema | undefined> = useRootEntitySchema()

const histogramsByAttributes = computed<[AttributeSchema, VisualisedHistogram][]>(() => {
    try {
        return visualiserService
            .getAttributeHistogramsService()
            .resolveAttributeHistogramsByAttributes(props.attributeHistogramsResult, rootEntitySchema.value!)
    } catch (e: unknown) {
        void toaster.error('Could not resolve attribute histograms', e) // todo lho i18n
        return []
    }
})
</script>

<template>
    <VExpansionPanels v-if="histogramsByAttributes && histogramsByAttributes.length > 0">
        <VExpansionPanel v-for="histogramByAttributeResult in histogramsByAttributes" :key="histogramByAttributeResult[0].name">
            <VExpansionPanelTitle class="d-flex">
                <VIcon class="mr-8">mdi-format-list-bulleted</VIcon>
                {{ histogramByAttributeResult[0]?.name }}
            </VExpansionPanelTitle>
            <VExpansionPanelText>
                <HistogramVisualiser :histogram="histogramByAttributeResult[1]"/>
            </VExpansionPanelText>
        </VExpansionPanel>
    </VExpansionPanels>

    <VMissingDataIndicator
        v-else
        icon="mdi-text-search"
        :title="t('resultVisualizer.attributeHistogram.placeholder.noAttributeHistograms')"
    />
</template>

<style lang="scss" scoped>

</style>
