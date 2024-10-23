<script setup lang="ts">
/**
 * Visualises raw JSON facet group statistics of a single reference
 */
import { computed, ref } from 'vue'
import { Toaster, useToaster } from '@/modules/notification/service/Toaster'
import { CatalogPointer } from '@/modules/connection/model/CatalogPointer'
import { ResultVisualiserService } from '@/modules/console/result-visualiser/service/ResultVisualiserService'
import { Result } from '@/modules/console/result-visualiser/model/Result'
import { ReferenceSchema } from '@/modules/connection/model/schema/ReferenceSchema'
import { ConnectionService, useConnectionService } from '@/modules/connection/service/ConnectionService'
import { EntitySchema } from '@/modules/connection/model/schema/EntitySchema'
import { NamingConvention } from '@/modules/connection/model/NamingConvetion'
import VListItemLazyIterator from '@/modules/base/component/VListItemLazyIterator.vue'
import FacetGroupStatisticsVisualiser
    from '@/modules/console/result-visualiser/component/facet-summary/FacetGroupStatisticsVisualiser.vue'
import FacetStatisticsVisualiser
    from '@/modules/console/result-visualiser/component/facet-summary/FacetStatisticsVisualiser.vue'
import { List } from 'immutable'

const statisticsPageSize: number = 10

const connectionService: ConnectionService = useConnectionService()
const toaster: Toaster = useToaster()

const props = defineProps<{
    catalogPointer: CatalogPointer,
    visualiserService: ResultVisualiserService,
    queryResult: Result,
    groupStatisticsResults: Result[],
    referenceSchema: ReferenceSchema
}>()

const initialized = ref<boolean>(false)
const groupStatisticsResultsPage = ref<number>(1)
const groupRepresentativeAttributes: string[] = []
const facetRepresentativeAttributes: string[] = []

const isGroupedFacets = computed<boolean>(() => {
    return props.referenceSchema.referencedGroupType.getIfSupported()! != undefined
})

const facetStatisticsResults = computed<Result[]>(() => {
    if (isGroupedFacets.value) {
        return []
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
        return []
    }
})
const facetStatisticsResultsPage = ref<number>(1)

function initialize() {
    let pipeline: Promise<string[]>
    if (!props.referenceSchema.referencedGroupTypeManaged.getOrElse(false)) {
        pipeline = new Promise(resolve => resolve([]))
    } else {
        pipeline = connectionService.getEntitySchema(
            props.catalogPointer.connection,
            props.catalogPointer.catalogName,
            props.referenceSchema.referencedGroupType.getIfSupported()!
        )
            .then((entitySchema: EntitySchema) => {
                return Array.from(entitySchema.attributes.getIfSupported()?.values() || [])
                    .filter(attributeSchema => attributeSchema.representative.getOrElse(false))
                    .map(attributeSchema => attributeSchema.nameVariants.getIfSupported()!.get(NamingConvention.CamelCase)!)
            })
    }

    pipeline
        .then((representativeAttributes: string[]) => {
            groupRepresentativeAttributes.push(...representativeAttributes)

            return connectionService.getEntitySchema(
                props.catalogPointer.connection,
                props.catalogPointer.catalogName,
                props.referenceSchema.entityType.getIfSupported()! as string
            ).then((entitySchema: EntitySchema) => {
                return Array.from(entitySchema.attributes.getIfSupported()!.values())
                    .filter(attributeSchema => attributeSchema.representative.getOrElse(false))
                    .map(attributeSchema => attributeSchema.nameVariants.getIfSupported()!.get(NamingConvention.CamelCase)!)
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
            <VListItemLazyIterator
                :items="groupStatisticsResults"
                v-model:page="groupStatisticsResultsPage"
                :page-size="statisticsPageSize"
            >
                <template #item="{ item: groupStatisticsResult }">
                    <FacetGroupStatisticsVisualiser
                        :visualiser-service="visualiserService"
                        :reference-schema="referenceSchema"
                        :query-result="queryResult"
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
                        :visualiser-service="visualiserService"
                        :reference-schema="referenceSchema"
                        :query-result="queryResult"
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
