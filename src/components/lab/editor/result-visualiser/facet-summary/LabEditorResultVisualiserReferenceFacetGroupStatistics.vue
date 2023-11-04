<script setup lang="ts">
/**
 * Visualises raw JSON facet group statistics of a single reference
 */
import { computed, ref } from 'vue'
import { EntitySchema, ReferenceSchema } from '@/model/evitadb'
import { LabService, useLabService } from '@/services/lab.service'
import { Toaster, useToaster } from '@/services/editor/toaster'
import { CatalogPointer } from '@/model/editor/editor'
import LabEditorResultVisualiserFacetGroupStatistics
    from '@/components/lab/editor/result-visualiser/facet-summary/LabEditorResultVisualiserFacetGroupStatistics.vue'
import LabEditorResultVisualiserFacetStatistics
    from '@/components/lab/editor/result-visualiser/facet-summary/LabEditorResultVisualiserFacetStatistics.vue'
import { Result } from '@/model/editor/result-visualiser'
import { ResultVisualiserService } from '@/services/editor/result-visualiser/result-visualiser.service'

const labService: LabService = useLabService()
const toaster: Toaster = useToaster()

const props = defineProps<{
    catalogPointer: CatalogPointer,
    visualiserService: ResultVisualiserService,
    queryResult: Result,
    groupStatisticsResults: Result[],
    referenceSchema: ReferenceSchema
}>()

const initialized = ref<boolean>(false)
const groupRepresentativeAttributes: string[] = []
const facetRepresentativeAttributes: string[] = []

const isGroupedFacets = computed<boolean>(() => {
    return props.referenceSchema.referencedGroupType != undefined
})

const facetStatisticsResults = computed<Result[] | undefined>(() => {
    if (isGroupedFacets.value) {
        return undefined
    }
    if (props.groupStatisticsResults.length === 0) {
        return []
    }
    try {
        return props.visualiserService
            .getFacetSummaryService()
            .findFacetStatisticsResults(props.groupStatisticsResults[0])
    } catch (e: any) {
        toaster.error(e)
        return undefined
    }
})

function initialize() {
    let pipeline: Promise<string[]>
    if (!props.referenceSchema.referencedGroupTypeManaged) {
        pipeline = new Promise(resolve => resolve([]))
    } else {
        pipeline = labService.getEntitySchema(
            props.catalogPointer.connection,
            props.catalogPointer.catalogName,
            props.referenceSchema.referencedGroupType as string
        )
            .then((entitySchema: EntitySchema) => {
                return Object.values(entitySchema.attributes)
                    .filter(attributeSchema => 'representative' in attributeSchema && attributeSchema.representative)
                    .map(attributeSchema => attributeSchema.nameVariants.camelCase)
            })
    }

    pipeline
        .then((representativeAttributes: string[]) => {
            groupRepresentativeAttributes.push(...representativeAttributes)

            return labService.getEntitySchema(
                props.catalogPointer.connection,
                props.catalogPointer.catalogName,
                props.referenceSchema.referencedEntityType as string
            ).then((entitySchema: EntitySchema) => {
                return Object.values(entitySchema.attributes)
                    .filter(attributeSchema => 'representative' in attributeSchema && attributeSchema.representative)
                    .map(attributeSchema => attributeSchema.nameVariants.camelCase)
            })
        })
        .then((representativeAttributes: string[]) => {
            facetRepresentativeAttributes.push(...representativeAttributes)
            initialized.value = true
        })
        .catch((e) => {
            toaster.error(e)
        })
}
initialize()
</script>

<template>
    <VList v-if="initialized" density="compact">
        <template v-if="isGroupedFacets">
            <LabEditorResultVisualiserFacetGroupStatistics
                v-for="(groupStatisticsResult, index) in groupStatisticsResults"
                :key="index"
                :visualiser-service="visualiserService"
                :query-result="queryResult"
                :group-statistics-result="groupStatisticsResult"
                :group-representative-attributes="groupRepresentativeAttributes"
                :facet-representative-attributes="facetRepresentativeAttributes"
            />
        </template>
        <template v-else>
            <LabEditorResultVisualiserFacetStatistics
                v-for="(facetStatisticsResult, index) in facetStatisticsResults"
                :key="index"
                :visualiser-service="visualiserService"
                :query-result="queryResult"
                :facet-statistics-result="facetStatisticsResult"
                :facet-representative-attributes="facetRepresentativeAttributes"
            />
        </template>
    </VList>
</template>

<style lang="scss" scoped>

</style>
