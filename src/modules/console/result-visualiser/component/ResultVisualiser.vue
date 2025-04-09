<script setup lang="ts">
/**
 * Visualises the raw JSON result of a GraphQL queries in human-readable GUI.
 */
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Toaster, useToaster } from '@/modules/notification/service/Toaster'
import { CatalogPointer } from '@/modules/connection/model/CatalogPointer'
import { ResultVisualiserService } from '@/modules/console/result-visualiser/service/ResultVisualiserService'
import { Result } from '@/modules/console/result-visualiser/model/Result'
import { VAutocomplete } from 'vuetify/components'
import { EntitySchema } from '@/modules/connection/model/schema/EntitySchema'
import { VisualiserType } from '@/modules/console/result-visualiser/model/VisualiserType'
import { VisualiserTypeType } from '@/modules/console/result-visualiser/model/VisualiserTypeType'
import FacetSummaryVisualiser
    from '@/modules/console/result-visualiser/component/facet-summary/FacetSummaryVisualiser.vue'
import HierarchyVisualiser from '@/modules/console/result-visualiser/component/hierarchy/HierarchyVisualiser.vue'
import AttributeHistogramsVisualiser
    from '@/modules/console/result-visualiser/component/histogram/AttributeHistogramsVisualiser.vue'
import PriceHistogramVisualiser
    from '@/modules/console/result-visualiser/component/histogram/PriceHistogramVisualiser.vue'
import VLoadingCircular from '@/modules/base/component/VLoadingCircular.vue'
import { Response } from '@/modules/connection/model/data/Response'
import VMissingDataIndicator from '@/modules/base/component/VMissingDataIndicator.vue'

const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<{
    catalogPointer: CatalogPointer,
    visualiserService: ResultVisualiserService,
    inputQuery: string,
    result: Response | undefined
}>()

const querySelectRef = ref<InstanceType<typeof VAutocomplete> | undefined>()
const selectedQuery = ref<string | undefined>()

const selectedVisualiserType = ref<VisualiserTypeType | undefined>()

const supportsMultipleQueries = computed<boolean>(() => {
    try {
        return props.visualiserService.supportsMultipleQueries()
    } catch (e: any) {
        toaster.error('Could resolve multiple queries support', e).then() // todo lho i18n
        return false
    }
})
const queries = computed<string[]>(() => {
    if (props.result == undefined) {
        return []
    }
    try {
        return props.visualiserService.findQueries(props.inputQuery, props.result)
    } catch (e: any) {
        toaster.error('Could not find queries', e).then() // todo lho i18n
        return []
    }
})

watch(queries, (newValue) => {
    // pre-select first a query on first load
    if (selectedQuery.value == undefined && newValue.length > 0) {
        selectedQuery.value = newValue[0]
        return
    }

    if (!supportsMultipleQueries.value) {
        if (newValue.length > 0) {
            selectedQuery.value = newValue[0]
        } else {
            selectedQuery.value = undefined
        }
    } else {
        if (selectedQuery.value != undefined && !newValue.includes(selectedQuery.value as string)) {
            // selected query was removed
            if (newValue.length > 0) {
                // pre-select next available query
                selectedQuery.value = newValue[0]
            } else {
                selectedQuery.value = undefined
            }
        }
    }
}, { immediate: true })

const selectedQueryResult = computed<Result | undefined>(() => {
    if (props.result == undefined || selectedQuery.value == undefined) {
        return undefined
    }
    try {
        return props.visualiserService.findQueryResult(props.result, selectedQuery.value as string)
    } catch (e: any) {
        toaster.error('Could not find query result', e).then() // todo lho i18n
        return undefined
    }
})
const selectedQueryEntitySchema = ref<EntitySchema | undefined>()
watch(selectedQuery, async () => {
    selectedQueryEntitySchema.value = undefined
    selectedVisualiserType.value = undefined
    if (selectedQuery.value == undefined) {
        return
    }

    try {
        selectedQueryEntitySchema.value = await props.visualiserService.getEntitySchemaForQuery(
            selectedQuery.value as string,
            props.catalogPointer.connection,
            props.catalogPointer.catalogName
        )
    } catch (e: any) {
        await toaster.error('Could not resolve entity schema', e) // todo lho i18n
    }
}, { immediate: true })


const visualiserTypesRef = ref<InstanceType<typeof VAutocomplete> | undefined>()
const visualiserTypes = computed<VisualiserType[]>(() => {
    if (selectedQuery.value == undefined || selectedQueryResult.value == undefined) {
        return []
    }
    try {
        return props.visualiserService.findVisualiserTypes(selectedQueryResult.value as Result)
    } catch (e: any) {
        toaster.error('Could not find visualiser types', e).then() // todo lho i18n
        return []
    }
})
watch(visualiserTypes, (newValue) => {
    // pre-select first a visualiser type on first load
    if (selectedVisualiserType.value == undefined && newValue.length > 0) {
        selectedVisualiserType.value = newValue[0].value
        return
    }

    if (selectedVisualiserType.value != undefined && !newValue.map(it => it.value).includes(selectedVisualiserType.value as VisualiserTypeType)) {
        // selected visualiser type was removed
        if (newValue.length > 0) {
            // pre-select next available visualiser type
            selectedVisualiserType.value = newValue[0].value
        } else {
            selectedVisualiserType.value = undefined
        }
    }
}, { immediate: true })

const resultForVisualiser = computed<Result | undefined>(() => {
    if (selectedQueryResult.value == undefined || selectedVisualiserType.value == undefined) {
        return undefined
    }
    try {
        return props.visualiserService
            .findResultForVisualiser(selectedQueryResult.value as Result, selectedVisualiserType.value as VisualiserTypeType)
    } catch (e: any) {
        toaster.error('Could not find result', e).then() // todo lho i18n
        return undefined
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
                v-model="selectedQuery"
                :disabled="queries.length == 0"
                prepend-inner-icon="mdi-database-search"
                :label="t('resultVisualizer.selector.label.query')"
                :items="queries"
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
            v-if="selectedVisualiserType == VisualiserTypeType.FacetSummary && selectedQueryResult != undefined && selectedQueryEntitySchema != undefined && resultForVisualiser != undefined"
            :catalog-pointer="catalogPointer"
            :visualiser-service="visualiserService"
            :query-result="selectedQueryResult"
            :facet-summary-result="resultForVisualiser"
            :entity-schema="selectedQueryEntitySchema"
        />
        <HierarchyVisualiser
            v-if="selectedVisualiserType == VisualiserTypeType.Hierarchy && selectedQueryResult != undefined && selectedQueryEntitySchema != undefined && resultForVisualiser != undefined"
            :catalog-pointer="catalogPointer"
            :visualiser-service="visualiserService"
            :hierarchy-result="resultForVisualiser"
            :entity-schema="selectedQueryEntitySchema"
        />
        <AttributeHistogramsVisualiser
            v-if="selectedVisualiserType == VisualiserTypeType.AttributeHistograms && selectedQueryResult != undefined && selectedQueryEntitySchema != undefined && resultForVisualiser != undefined"
            :visualiser-service="visualiserService"
            :attribute-histograms-result="resultForVisualiser"
            :entity-schema="selectedQueryEntitySchema"
        />
        <PriceHistogramVisualiser
            v-if="selectedVisualiserType == VisualiserTypeType.PriceHistogram && selectedQueryResult != undefined && selectedQueryEntitySchema != undefined && resultForVisualiser != undefined"
            :visualiser-service="visualiserService"
            :price-histogram-result="resultForVisualiser"
        />

        <VMissingDataIndicator
            v-else-if="queries.length == 0"
            icon="mdi-text-search"
            :title="t('resultVisualizer.visualiser.placeholder.noQueries')"
        />
        <VMissingDataIndicator
            v-else-if="selectedQuery == undefined"
            icon="mdi-database-search"
            :title="t('resultVisualizer.visualiser.placeholder.noSelectedQuery')"
        />
        <VMissingDataIndicator
            v-else-if="selectedVisualiserType == undefined"
            icon="mdi-format-list-bulleted-type"
            :title="t('resultVisualizer.visualiser.placeholder.noSelectedData')"
        />
        <VMissingDataIndicator v-else-if="selectedQueryResult == undefined || selectedQueryEntitySchema == undefined || resultForVisualiser == undefined">
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
