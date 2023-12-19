<script setup lang="ts">
/**
 * Entities console. Allows to view entities of specified collection.
 */

import 'splitpanes/dist/splitpanes.css'

import { onBeforeMount, ref, watch } from 'vue'
import {
    DataGridConsoleData,
    DataGridConsoleParams, EntityPropertyDescriptor,
    EntityPropertyKey, EntityPropertyType,
    QueryResult
} from '@/model/editor/data-grid'
import { DataGridService, useDataGridService } from '@/services/editor/data-grid.service'
import { QueryLanguage } from '@/model/lab'
import { Toaster, useToaster } from '@/services/editor/toaster'
import { TabComponentEvents, TabComponentProps } from '@/model/editor/editor'
import LabEditorDataGridQueryInput from '@/components/lab/editor/data-grid/LabEditorDataGridQueryInput.vue'
import LabEditorDataGridToolbar from '@/components/lab/editor/data-grid/LabEditorDataGridToolbar.vue'
import LabEditorDataGridGrid from '@/components/lab/editor/data-grid/grid/LabEditorDataGridGrid.vue'

const dataGridService: DataGridService = useDataGridService()
const toaster: Toaster = useToaster()

const props = defineProps<TabComponentProps<DataGridConsoleParams, DataGridConsoleData>>()
const emit = defineEmits<TabComponentEvents>()

// static data
const path = ref<string[]>([
    props.params.dataPointer.catalogName,
    props.params.dataPointer.entityType
])

let sortedEntityPropertyKeys: string[] = []
let entityPropertyDescriptors: EntityPropertyDescriptor[] = []
const entityPropertyDescriptorIndex: Map<string, EntityPropertyDescriptor> = new Map<string, EntityPropertyDescriptor>()

let gridHeaders: Map<string, any> = new Map<string, any>()
let dataLocales: string[] = []

// dynamic user data
const selectedQueryLanguage = ref<QueryLanguage>(props.data?.queryLanguage ? props.data.queryLanguage : QueryLanguage.EvitaQL)
watch(selectedQueryLanguage, (newValue, oldValue) => {
    if (newValue[0] === oldValue[0]) {
        return
    }

    filterByCode.value = ''
    orderByCode.value = ''

    executeQuery()
})

const loading = ref<boolean>(false)
const pageNumber = ref<number>(props.data?.pageNumber ? props.data.pageNumber : 1)
const pageSize = ref<number>(props.data?.pageSize ? props.data.pageSize : 25)

const filterByCode = ref<string>(props.data?.filterBy ? props.data.filterBy : '')
const orderByCode = ref<string>(props.data?.orderBy ? props.data.orderBy : '')

const selectedDataLocale = ref<string | undefined>(props.data?.dataLocale ? props.data.dataLocale : undefined)
watch(selectedDataLocale, () => executeQuery())

const displayedProperties = ref<EntityPropertyKey[]>(props.data?.displayedProperties ? props.data.displayedProperties : [])
watch(displayedProperties, (newValue, oldValue) => {
    updateDisplayedGridHeaders()

    // re-fetch entities only if new properties were added, only in such case there could be missing data when displaying
    // the new properties
    if (newValue.length > oldValue.length) {
        executeQuery()
    }
})

const displayedGridHeaders = ref<any[]>([])
const resultEntities = ref<any[]>([])
const totalResultCount = ref<number>(0)

const initialized = ref<boolean>(false)

emit('ready')
onBeforeMount(() => {
    // note: we can't use async/await here, because that would make this component async which currently doesn't seem to work
    // properly in combination with dynamic <component> rendering and tabs

    dataGridService.getDataLocales(props.params.dataPointer)
        .then(dl => {
            dataLocales = dl
            return dataGridService.getEntityPropertyDescriptors(props.params.dataPointer)
        })
        .then(ep => {
            entityPropertyDescriptors = ep
            for (const entityPropertyDescriptor of entityPropertyDescriptors) {
                entityPropertyDescriptorIndex.set(entityPropertyDescriptor.key.toString(), entityPropertyDescriptor)
                entityPropertyDescriptor.children.forEach(childPropertyDescriptor => {
                    entityPropertyDescriptorIndex.set(childPropertyDescriptor.key.toString(), childPropertyDescriptor)
                })

                sortedEntityPropertyKeys.push(entityPropertyDescriptor.key.toString())
                for (const childEntityPropertyDescriptor of entityPropertyDescriptor.children) {
                    sortedEntityPropertyKeys.push(childEntityPropertyDescriptor.key.toString())
                }
            }
            return initializeGridHeaders(entityPropertyDescriptors)
        })
        .then(gh => {
            gridHeaders = gh
            preselectEntityProperties()
            initialized.value = true
            emit('ready')

            if (props.params.executeOnOpen) {
                executeQuery()
            }
        })
        .catch(error => {
            toaster.error(error)
        })
})

async function initializeGridHeaders(entityPropertyDescriptors: EntityPropertyDescriptor[]): Promise<Map<string, any>> {
    const gridHeaders: Map<string, any> = new Map<string, any>()
    for (const propertyDescriptor of entityPropertyDescriptors) {
        gridHeaders.set(
            propertyDescriptor.key.toString(),
            {
                key: propertyDescriptor.key.toString(),
                title: propertyDescriptor.flattenedTitle,
                sortable: propertyDescriptor.isSortable(),
                descriptor: propertyDescriptor
            }
        )
        for (const childPropertyDescriptor of propertyDescriptor.children) {
            gridHeaders.set(
                childPropertyDescriptor.key.toString(),
                {
                    key: childPropertyDescriptor.key.toString(),
                    title: childPropertyDescriptor.flattenedTitle,
                    sortable: childPropertyDescriptor.schema?.sortable || false,
                    descriptor: childPropertyDescriptor
                }
            )
        }
    }
    return gridHeaders
}

async function updateDisplayedGridHeaders(): Promise<void> {
    displayedGridHeaders.value = displayedProperties.value.map(propertyKey => gridHeaders.get(propertyKey.toString()))

    // sort grid headers by entity properties order
    displayedGridHeaders.value.sort((a, b) => {
        return sortedEntityPropertyKeys.indexOf(a.key.toString()) - sortedEntityPropertyKeys.indexOf(b.key.toString())
    })
}

function preselectEntityProperties(): void {
    if (displayedProperties.value.length > 0) {
        // already preselected by initiator
        return
    }

    displayedProperties.value = entityPropertyDescriptors
        .filter(it => it.key.type === EntityPropertyType.Entity || it.schema?.representative)
        .map(it => it.key)
}

async function gridUpdated({ page, itemsPerPage, sortBy }: { page: number, itemsPerPage: number, sortBy: any[] }): Promise<void> {
    pageNumber.value = page
    pageSize.value = itemsPerPage
    try {
        orderByCode.value = await dataGridService.buildOrderByFromGridColumns(props.params.dataPointer, selectedQueryLanguage.value, sortBy)
    } catch (error: any) {
        toaster.error(error)
    }

    await executeQuery()
}

async function executeQuery(): Promise<void> {
    loading.value = true

    try {
        const result: QueryResult = await dataGridService.executeQuery(
            props.params.dataPointer,
            selectedQueryLanguage.value,
            filterByCode.value,
            orderByCode.value,
            selectedDataLocale.value,
            displayedProperties.value,
            pageNumber.value,
            pageSize.value
        )
        resultEntities.value = result.entities.map(entity => {
            const row: any = {}
            entity.forEach(([propertyKey, propertyValue]) => row[propertyKey.toString()] = propertyValue)
            return row
        })
        totalResultCount.value = result.totalEntitiesCount
    } catch (error: any) {
        toaster.error(error)
    }

    loading.value = false
}

</script>

<template>
    <div
        v-if="initialized"
        class="data-grid"
    >
        <LabEditorDataGridToolbar
            :path="path"
            :locale="selectedDataLocale"
            :loading="loading"
            @execute-query="executeQuery"
        >
            <template #query>
                <LabEditorDataGridQueryInput
                    :grid-props="props"
                    v-model:selected-query-language="selectedQueryLanguage"
                    v-model:filter-by="filterByCode"
                    v-model:order-by="orderByCode"
                    :data-locales="dataLocales"
                    v-model:selected-data-locale="selectedDataLocale"
                    :entity-property-descriptor-index="entityPropertyDescriptorIndex"
                    v-model:selected-entity-property-keys="displayedProperties"
                    @execute-query="executeQuery"
                />
            </template>
        </LabEditorDataGridToolbar>

        <LabEditorDataGridGrid
            :grid-props="props"
            :entity-property-descriptor-index="entityPropertyDescriptorIndex"
            :displayed-grid-headers="displayedGridHeaders"
            :data-locale="selectedDataLocale"
            :query-language="selectedQueryLanguage"
            :loading="loading"
            :result-entities="resultEntities"
            :total-result-count="totalResultCount"
            :page-number="pageNumber"
            :page-size="pageSize"
            @grid-updated="gridUpdated"
        />
    </div>
</template>

<style lang="scss" scoped>
.data-grid {
    display: grid;
    grid-template-rows: 5.5rem 1fr;
    overflow-y: auto;
}
</style>
