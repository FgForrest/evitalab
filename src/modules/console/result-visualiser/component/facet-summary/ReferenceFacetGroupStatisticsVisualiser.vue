<script setup lang="ts">
/**
 * Visualises raw JSON facet group statistics of a single reference
 */
import { computed, ref } from 'vue'
import { useToaster } from '@/modules/notification/service/Toaster'
import type { Toaster } from '@/modules/notification/service/Toaster'
import { ResultVisualiserService } from '@/modules/console/result-visualiser/service/ResultVisualiserService'
import type { Result } from '@/modules/console/result-visualiser/model/Result'
import { ReferenceSchema } from '@/modules/database-driver/request-response/schema/ReferenceSchema'
import VListItemLazyIterator from '@/modules/base/component/VListItemLazyIterator.vue'
import FacetGroupStatisticsVisualiser
    from '@/modules/console/result-visualiser/component/facet-summary/FacetGroupStatisticsVisualiser.vue'
import FacetStatisticsVisualiser
    from '@/modules/console/result-visualiser/component/facet-summary/FacetStatisticsVisualiser.vue'
import { useCatalogPointer, useVisualiserService } from '@/modules/console/result-visualiser/component/dependencies'
import { CatalogPointer } from '@/modules/viewer-support/model/CatalogPointer'

const statisticsPageSize: number = 10

const toaster: Toaster = useToaster()

const props = defineProps<{
    groupStatisticsResults: Result[],
    referenceSchema: ReferenceSchema
}>()

const visualiserService: ResultVisualiserService = useVisualiserService()
const catalogPointer: CatalogPointer = useCatalogPointer()

const initialized = ref<boolean>(false)
const groupStatisticsResultsPage = ref<number>(1)
const groupRepresentativeAttributes: string[] = []
const facetRepresentativeAttributes: string[] = []

const isGroupedFacets = computed<boolean>(() => {
    return props.referenceSchema.referencedGroupType != undefined
})

const facetStatisticsResults = computed<Result[]>(() => {
    if (isGroupedFacets.value) {
        return []
    }
    if (props.groupStatisticsResults.length === 0) {
        return []
    }
    try {
        return visualiserService
            .getFacetSummaryService()
            .findFacetStatisticsResults(props.groupStatisticsResults[0])
    } catch (e: any) {
        toaster.error('Could not find facet statistics results', e).then() // todo lho i18n
        return []
    }
})
const facetStatisticsResultsPage = ref<number>(1)

function initialize() {
    let pipeline: Promise<string[]>
    if (!props.referenceSchema.referencedGroupTypeManaged) {
        pipeline = new Promise(resolve => resolve([]))
    } else {
        pipeline = visualiserService.resolveRepresentativeAttributes(
            catalogPointer.catalogName,
            props.referenceSchema.referencedGroupType as string
        )
    }

    pipeline
        .then((representativeAttributes: string[]) => {
            groupRepresentativeAttributes.push(...representativeAttributes)

            return visualiserService.resolveRepresentativeAttributes(
                catalogPointer.catalogName,
                props.referenceSchema.entityType
            )
        })
        .then((representativeAttributes: string[]) => {
            facetRepresentativeAttributes.push(...representativeAttributes)
            initialized.value = true
        })
        .catch((e) => {
            toaster.error('Could not initialize facet groups statistics', e).then() // todo lho i18n
        })
}
initialize()
</script>

<template>
    <VList v-if="initialized" density="compact">
        <template v-if="isGroupedFacets">
            <VListItemLazyIterator
                :items="groupStatisticsResults"
                v-model:page="groupStatisticsResultsPage"
                :page-size="statisticsPageSize"
            >
                <template #item="{ item: groupStatisticsResult }">
                    <FacetGroupStatisticsVisualiser
                        :reference-schema="referenceSchema"
                        :group-statistics-result="groupStatisticsResult"
                        :group-representative-attributes="groupRepresentativeAttributes"
                        :facet-representative-attributes="facetRepresentativeAttributes"
                    />
                </template>
            </VListItemLazyIterator>
        </template>
        <template v-else>
            <VListItemLazyIterator
                :items="facetStatisticsResults"
                v-model:page="facetStatisticsResultsPage"
                :page-size="statisticsPageSize"
            >
                <template #item="{ item: facetStatisticsResult }">
                    <FacetStatisticsVisualiser
                        :reference-schema="referenceSchema"
                        :facet-statistics-result="facetStatisticsResult"
                        :facet-representative-attributes="facetRepresentativeAttributes"
                    />
                </template>
            </VListItemLazyIterator>
        </template>
    </VList>
</template>

<style lang="scss" scoped>

</style>
