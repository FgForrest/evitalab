<script setup lang="ts">
/**
 * Main orchestrator for result visualisation. Analyzes raw query results, presents query and
 * visualiser type selectors, and delegates parsing + rendering to per-type child components.
 */
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToaster } from '@/modules/notification/service/Toaster'
import type { Toaster } from '@/modules/notification/service/Toaster'
import type { ResultVisualiserService } from '@/modules/console/result-visualiser/service/ResultVisualiserService'
import { VAutocomplete } from 'vuetify/components'
import { VisualiserType } from '@/modules/console/result-visualiser/model/VisualiserType'
import { VisualiserTypeType } from '@/modules/console/result-visualiser/model/VisualiserTypeType'
import { AnalyzedResult, AnalyzedQuery } from '@/modules/console/result-visualiser/model/AnalyzedResult'
import type { VisualisedFacetSummary } from '@/modules/console/result-visualiser/model/facet-summary/VisualisedFacetSummary'
import type { VisualisedHierarchyResult } from '@/modules/console/result-visualiser/model/hierarchy/VisualisedHierarchyResult'
import type { VisualisedAttributeHistograms } from '@/modules/console/result-visualiser/model/histogram/VisualisedAttributeHistograms'
import type { VisualisedHistogram } from '@/modules/console/result-visualiser/model/histogram/VisualisedHistogram'
import FacetSummaryVisualiser
    from '@/modules/console/result-visualiser/component/facet-summary/FacetSummaryVisualiser.vue'
import HierarchyVisualiser from '@/modules/console/result-visualiser/component/hierarchy/HierarchyVisualiser.vue'
import AttributeHistogramsVisualiser
    from '@/modules/console/result-visualiser/component/histogram/AttributeHistogramsVisualiser.vue'
import PriceHistogramVisualiser
    from '@/modules/console/result-visualiser/component/histogram/PriceHistogramVisualiser.vue'
import VLoadingCircular from '@/modules/base/component/VLoadingCircular.vue'
import VMissingDataIndicator from '@/modules/base/component/VMissingDataIndicator.vue'
import { CatalogPointer } from '@/modules/viewer-support/model/CatalogPointer'

const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<{
    catalogPointer: CatalogPointer,
    visualiserService: ResultVisualiserService,
    inputQuery: string,
    result: unknown
}>()

const querySelectRef = ref<InstanceType<typeof VAutocomplete> | undefined>()
const visualiserTypesRef = ref<InstanceType<typeof VAutocomplete> | undefined>()

const supportsMultipleQueries = computed<boolean>(() => {
    try {
        return props.visualiserService.resultAnalyzer.supportsMultipleQueries()
    } catch (e: any) {
        toaster.error('Could resolve multiple queries support', e).then()
        return false
    }
})

const analyzedResult = ref<AnalyzedResult | undefined>()
const loading = ref<boolean>(false)

watch([() => props.result, () => props.inputQuery], async () => {
    if (!props.result) {
        analyzedResult.value = undefined
        return
    }
    loading.value = true
    try {
        analyzedResult.value = await props.visualiserService.resultAnalyzer.analyze(
            props.inputQuery,
            props.result,
            props.catalogPointer.catalogName
        )
    } catch (e: any) {
        analyzedResult.value = undefined
        toaster.error('Could not analyze result', e).then()
    } finally {
        loading.value = false
    }
}, { immediate: true })

const selectedQueryName = ref<string | undefined>()

const queryNames = computed<string[]>(() => {
    return analyzedResult.value?.queries.map(q => q.name) ?? []
})

watch(queryNames, (newValue) => {
    if (selectedQueryName.value == undefined && newValue.length > 0) {
        selectedQueryName.value = newValue[0]
        return
    }
    if (!supportsMultipleQueries.value) {
        selectedQueryName.value = newValue.length > 0 ? newValue[0] : undefined
    } else {
        if (selectedQueryName.value != undefined && !newValue.includes(selectedQueryName.value)) {
            selectedQueryName.value = newValue.length > 0 ? newValue[0] : undefined
        }
    }
}, { immediate: true })

const selectedQuery = computed<AnalyzedQuery | undefined>(() => {
    if (selectedQueryName.value == undefined || analyzedResult.value == undefined) return undefined
    return analyzedResult.value.queries.find(q => q.name === selectedQueryName.value)
})

const selectedVisualiserType = ref<VisualiserTypeType | undefined>()

const visualiserTypes = computed<VisualiserType[]>(() => {
    return selectedQuery.value?.visualiserTypes ?? []
})

watch(visualiserTypes, (newValue) => {
    if (newValue.length > 0) {
        if (selectedVisualiserType.value == undefined || !newValue.map(it => it.value).includes(selectedVisualiserType.value)) {
            selectedVisualiserType.value = newValue[0].value
        }
    } else {
        selectedVisualiserType.value = undefined
    }
}, { immediate: true })

const parsedFacetSummary = ref<VisualisedFacetSummary | undefined>()
const parsedHierarchy = ref<VisualisedHierarchyResult | undefined>()
const parsedAttributeHistograms = ref<VisualisedAttributeHistograms | undefined>()
const parsedPriceHistogram = ref<VisualisedHistogram | undefined>()
const parsingResult = ref<boolean>(false)

watch([selectedVisualiserType, selectedQuery], async () => {
    parsedFacetSummary.value = undefined
    parsedHierarchy.value = undefined
    parsedAttributeHistograms.value = undefined
    parsedPriceHistogram.value = undefined

    if (!selectedQuery.value || !selectedVisualiserType.value) return

    const query = selectedQuery.value
    const queryResult = query.queryResult

    parsingResult.value = true
    try {
        switch (selectedVisualiserType.value) {
            case VisualiserTypeType.FacetSummary:
                parsedFacetSummary.value = await props.visualiserService.facetSummaryParser
                    .parse(queryResult, query.entitySchema!, props.catalogPointer.catalogName)
                break
            case VisualiserTypeType.Hierarchy:
                parsedHierarchy.value = await props.visualiserService.hierarchyParser
                    .parse(queryResult, query.entitySchema!, props.catalogPointer.catalogName)
                break
            case VisualiserTypeType.AttributeHistograms:
                parsedAttributeHistograms.value = props.visualiserService.attributeHistogramsParser
                    .parse(queryResult, query.entitySchema!)
                break
            case VisualiserTypeType.PriceHistogram:
                parsedPriceHistogram.value = props.visualiserService.priceHistogramParser
                    .parse(queryResult)
                break
        }
    } catch (e: any) {
        toaster.error('Could not parse result for visualisation', e).then()
    } finally {
        parsingResult.value = false
    }
})

/**
 * Focuses the first input in visualiser.
 */
function focus(): void {
    if (supportsMultipleQueries.value) {
        querySelectRef.value?.focus()
    } else {
        visualiserTypesRef.value?.focus()
    }
}

defineExpose<{
    focus: () => void
}>({
    focus
})
</script>

<template>
    <div class="visualiser">
        <header>
            <VAutocomplete
                v-if="supportsMultipleQueries"
                ref="querySelectRef"
                v-model="selectedQueryName"
                :disabled="queryNames.length == 0"
                prepend-inner-icon="mdi-database-search"
                :label="t('resultVisualizer.selector.label.query')"
                :items="queryNames"
                class="visualiser__select"
                hide-details
            />
            <VAutocomplete
                ref="visualiserTypesRef"
                v-model="selectedVisualiserType"
                :disabled="selectedQuery == undefined"
                prepend-inner-icon="mdi-format-list-bulleted-type"
                :label="t('resultVisualizer.selector.label.data')"
                :items="visualiserTypes"
                :return-object="false"
                class="visualiser__select"
                hide-details
            />
        </header>

        <FacetSummaryVisualiser
            v-if="selectedVisualiserType == VisualiserTypeType.FacetSummary && parsedFacetSummary != undefined"
            :facet-summary="parsedFacetSummary"
        />
        <HierarchyVisualiser
            v-if="selectedVisualiserType == VisualiserTypeType.Hierarchy && parsedHierarchy != undefined"
            :hierarchy-result="parsedHierarchy"
            :entity-schema="selectedQuery?.entitySchema"
        />
        <AttributeHistogramsVisualiser
            v-if="selectedVisualiserType == VisualiserTypeType.AttributeHistograms && parsedAttributeHistograms != undefined"
            :attribute-histograms="parsedAttributeHistograms"
        />
        <PriceHistogramVisualiser
            v-if="selectedVisualiserType == VisualiserTypeType.PriceHistogram && parsedPriceHistogram != undefined"
            :histogram="parsedPriceHistogram"
        />

        <VMissingDataIndicator
            v-else-if="queryNames.length == 0 && !loading"
            icon="mdi-text-search"
            :title="t('resultVisualizer.visualiser.placeholder.noQueries')"
        />
        <VMissingDataIndicator
            v-else-if="selectedQuery == undefined && !loading"
            icon="mdi-database-search"
            :title="t('resultVisualizer.visualiser.placeholder.noSelectedQuery')"
        />
        <VMissingDataIndicator
            v-else-if="selectedVisualiserType == undefined && !loading"
            icon="mdi-format-list-bulleted-type"
            :title="t('resultVisualizer.visualiser.placeholder.noSelectedData')"
        />
        <VMissingDataIndicator v-else-if="loading || parsingResult">
            <VLoadingCircular :size="64" />
        </VMissingDataIndicator>
    </div>
</template>

<style lang="scss" scoped>
.visualiser {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    overflow-y: auto;

    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;

    header {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    &__select {
        flex: 1;
        min-width: 10rem;
    }
}


</style>
