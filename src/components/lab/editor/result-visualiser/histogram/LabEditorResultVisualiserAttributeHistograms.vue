<script setup lang="ts">
/**
 * Visualises the raw JSON attribute histograms.
 */

import { ResultVisualiserService } from '@/services/editor/result-visualiser/result-visualiser.service'
import { Result, VisualisedHistogram } from '@/model/editor/result-visualiser'
import { AttributeSchemaUnion, EntitySchema } from '@/model/evitadb'
import LabEditorResultVisualiserMissingDataIndicator
    from '@/components/lab/editor/result-visualiser/LabEditorResultVisualiserMissingDataIndicator.vue'
import { computed } from 'vue'
import { Toaster, useToaster } from '@/services/editor/toaster'
import LabEditorResultVisualiserHistogram
    from '@/components/lab/editor/result-visualiser/histogram/LabEditorResultVisualiserHistogram.vue'

const toaster: Toaster = useToaster()

const props = defineProps<{
    visualiserService: ResultVisualiserService,
    attributeHistogramsResult: Result,
    entitySchema: EntitySchema,
}>()

const histogramsByAttributes = computed<[AttributeSchemaUnion, VisualisedHistogram][]>(() => {
    try {
        return props.visualiserService
            .getAttributeHistogramsService()
            .resolveAttributeHistogramsByAttributes(props.attributeHistogramsResult, props.entitySchema)
    } catch (e: any) {
        toaster.error(e)
        return []
    }
})
</script>

<template>
    <VExpansionPanels v-if="histogramsByAttributes && histogramsByAttributes.length > 0" variant="accordion">
        <VExpansionPanel v-for="histogramByAttributeResult in histogramsByAttributes" :key="histogramByAttributeResult[0].name">
            <VExpansionPanelTitle class="d-flex">
                <VIcon class="mr-8">mdi-format-list-bulleted</VIcon>
                {{ histogramByAttributeResult[0]?.name }}
            </VExpansionPanelTitle>
            <VExpansionPanelText>
                <LabEditorResultVisualiserHistogram :histogram="histogramByAttributeResult[1]"/>
            </VExpansionPanelText>
        </VExpansionPanel>
    </VExpansionPanels>

    <LabEditorResultVisualiserMissingDataIndicator
        v-else
        icon="mdi-text-search"
        title="No attribute histograms found."
    />
</template>

<style lang="scss" scoped>

</style>
