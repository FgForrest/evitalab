<script setup lang="ts">
/**
 * Entities console. Allows to view entities of specified collection.
 */

import 'splitpanes/dist/splitpanes.css'

import { computed, onBeforeMount, provide, readonly, ref, watch } from 'vue'
import {
    DataGridData,
    DataGridParams,
    dataLocaleKey,
    EntityPropertyDescriptor,
    entityPropertyDescriptorIndexKey,
    EntityPropertyKey,
    EntityPropertyType,
    FlatEntity,
    gridPropsKey,
    priceTypeKey,
    queryFilterKey,
    queryLanguageKey,
    QueryResult
} from '@/model/editor/tab/dataGrid/data-grid'
import { DataGridService, useDataGridService } from '@/services/editor/data-grid.service'
import { QueryLanguage } from '@/model/lab'
import { Toaster, useToaster } from '@/services/editor/toaster'
import LabEditorDataGridQueryInput from '@/components/lab/editor/data-grid/LabEditorDataGridQueryInput.vue'
import LabEditorDataGridToolbar from '@/components/lab/editor/data-grid/LabEditorDataGridToolbar.vue'
import LabEditorDataGridGrid from '@/components/lab/editor/data-grid/grid/LabEditorDataGridGrid.vue'
import { QueryPriceMode } from '@/model/evitadb'
import { TabComponentProps } from '@/model/editor/tab/TabComponentProps'
import { TabComponentEvents } from '@/model/editor/tab/TabComponentEvents'
import VActionTooltip from '@/components/base/VActionTooltip.vue'
import { Command } from '@/model/editor/keymap/Command'

const dataGridService: DataGridService = useDataGridService()
const toaster: Toaster = useToaster()

const props = defineProps<TabComponentProps<DataGridParams, DataGridData>>()
const emit = defineEmits<TabComponentEvents>()
provide(gridPropsKey, props!)

// static data
const path = ref<string[]>([
    props.params.dataPointer.catalogName,
    props.params.dataPointer.entityType
])

let sortedEntityPropertyKeys: string[] = []
let entityPropertyDescriptors: EntityPropertyDescriptor[] = []
const entityPropertyDescriptorIndex = ref<Map<string, EntityPropertyDescriptor>>(new Map<string, EntityPropertyDescriptor>())
provide(entityPropertyDescriptorIndexKey, entityPropertyDescriptorIndex)

let gridHeaders: Map<string, any> = new Map<string, any>()
let dataLocales: string[] = []

// dynamic user data
const selectedQueryLanguage = ref<QueryLanguage>(props.data.queryLanguage ? props.data.queryLanguage : QueryLanguage.EvitaQL)
provide(queryLanguageKey, readonly(selectedQueryLanguage))
watch(selectedQueryLanguage, (newValue, oldValue) => {
    if (newValue[0] === oldValue[0]) {
        return
    }

    filterByCode.value = ''
    orderByCode.value = ''

    executeQueryAutomatically()
})

const loading = ref<boolean>(false)
const pageNumber = ref<number>(props.data.pageNumber ? props.data.pageNumber : 1)
const pageSize = ref<number>(props.data.pageSize ? props.data.pageSize : 25)

const filterByCode = ref<string>(props.data.filterBy ? props.data.filterBy : '')
const lastAppliedFilterByCode = ref<string>('')
provide(queryFilterKey, readonly(lastAppliedFilterByCode))
const orderByCode = ref<string>(props.data.orderBy ? props.data.orderBy : '')

const selectedDataLocale = ref<string | undefined>(props.data.dataLocale ? props.data.dataLocale : undefined)
provide(dataLocaleKey, readonly(selectedDataLocale))
watch(selectedDataLocale, () => executeQueryAutomatically())

const selectedPriceType = ref<QueryPriceMode | undefined>(props.data.priceType ? props.data.priceType : undefined)
watch(selectedPriceType, () => executeQueryAutomatically())
provide(priceTypeKey, readonly(selectedPriceType))

const displayedProperties = ref<EntityPropertyKey[]>(props.data.displayedProperties ? props.data.displayedProperties : [])
watch(displayedProperties, (newValue, oldValue) => {
    updateDisplayedGridHeaders()

    // re-fetch entities only if new properties were added, only in such case there could be missing data when displaying
    // the new properties
    if (newValue.length > oldValue.length) {
        executeQueryAutomatically()
    }
})

const displayedGridHeaders = ref<any[]>([])
const resultEntities = ref<FlatEntity[]>([])
const totalResultCount = ref<number>(0)

const initialized = ref<boolean>(false)
const queryExecutedManually = ref<boolean>(false)
const queryExecuted = computed<boolean>(() => queryExecutedManually.value || props.params.executeOnOpen)

const currentData = computed<DataGridData>(() => {
    return new DataGridData(
        selectedQueryLanguage.value,
        filterByCode.value,
        orderByCode.value,
        selectedDataLocale.value,
        displayedProperties.value,
        pageSize.value,
        pageNumber.value
    )
})
watch(currentData, (data) => {
    emit('dataUpdate', data)
})

onBeforeMount(() => {
    // note: we can't use async/await here, because that would make this component async which currently doesn't seem to work
    // properly in combination with dynamic <component> rendering and tabs

    dataGridService.getDataLocales(props.params.dataPointer)
        .then(dl => {
            dataLocales = dl
            return dataGridService.supportsPrices(props.params.dataPointer)
        })
        .then(supportsPrices => {
            preselectPriceType(supportsPrices)
            return dataGridService.getEntityPropertyDescriptors(props.params.dataPointer)
        })
        .then(ep => {
            entityPropertyDescriptors = ep
            for (const entityPropertyDescriptor of entityPropertyDescriptors) {
                entityPropertyDescriptorIndex.value.set(entityPropertyDescriptor.key.toString(), entityPropertyDescriptor)
                entityPropertyDescriptor.children.forEach(childPropertyDescriptor => {
                    entityPropertyDescriptorIndex.value.set(childPropertyDescriptor.key.toString(), childPropertyDescriptor)
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
                executeQueryAutomatically()
            }

            emit('ready')
        })
        .catch(error => {
            toaster.error(error)
        })
})

function preselectPriceType(supportsPrices: boolean): void {
    // we want to preselect price type only if it's not already preselected by initial data
    if (selectedPriceType.value == undefined) {
        selectedPriceType.value = supportsPrices ? QueryPriceMode.WithTax : undefined
    }
}

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
                    sortable: childPropertyDescriptor.isSortable(),
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
        // but because we don't trigger the watch to update the headers, we need to do it manually
        updateDisplayedGridHeaders()
        return
    }

    displayedProperties.value = entityPropertyDescriptors
        .filter(it => it.key.type === EntityPropertyType.Entity || it.key.type === EntityPropertyType.Prices || it.schema?.representative)
        .map(it => it.key)
}

async function gridUpdated({ page, itemsPerPage, sortBy }: { page: number, itemsPerPage: number, sortBy: any[] }): Promise<void> {
    pageNumber.value = page
    pageSize.value = itemsPerPage
    if (sortBy.length > 0) {
        try {
            orderByCode.value = await dataGridService.buildOrderByFromGridColumns(props.params.dataPointer, selectedQueryLanguage.value, sortBy)
        } catch (error: any) {
            toaster.error(error)
        }
    }

    await executeQueryAutomatically()
}

/**
 * Executes query. Should be used only by functions which are triggered directly by user action (e.g. by clicking on button).
 */
async function executeQueryManually(): Promise<void> {
    if (!queryExecutedManually.value) {
        queryExecutedManually.value = true
    }
    await executeQuery()
}

/**
 * Executes query. Should be used only by functions which are triggered either automatically by components itself or indirectly
 * by user action (e.g. by changing page number).
 */
async function executeQueryAutomatically(): Promise<void> {
    // We can execute query automatically only if it was already executed manually by user or if it was requested by
    // params.
    // Otherwise, we need to wait for the user because the query may contain malicious code which we don't want to execute
    // automatically before user gave consent with manual execution.
    if (queryExecuted.value) {
        await executeQuery()
    }
}

/**
 * Actual query execution, shouldn't be used directly. Only through {@link executeQueryManually()} or {@link executeQueryAutomatically()}.
 */
async function executeQuery(): Promise<void> {
    loading.value = true

    try {
        const result: QueryResult = await dataGridService.executeQuery(
            props.params.dataPointer,
            selectedQueryLanguage.value,
            filterByCode.value,
            orderByCode.value,
            selectedDataLocale.value,
            selectedPriceType.value,
            displayedProperties.value,
            pageNumber.value,
            pageSize.value
        )
        resultEntities.value = result.entities
        totalResultCount.value = result.totalEntitiesCount

        lastAppliedFilterByCode.value = filterByCode.value
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
            :current-data="currentData"
            :path="path"
            :loading="loading"
            @execute-query="executeQueryManually"
        >
            <template #query>
                <LabEditorDataGridQueryInput
                    v-model:selected-query-language="selectedQueryLanguage"
                    v-model:filter-by="filterByCode"
                    v-model:order-by="orderByCode"
                    :data-locales="dataLocales"
                    v-model:selected-data-locale="selectedDataLocale"
                    v-model:selected-price-type="selectedPriceType"
                    v-model:selected-entity-property-keys="displayedProperties"
                    @execute-query="executeQueryManually"
                />
            </template>
        </LabEditorDataGridToolbar>

        <LabEditorDataGridGrid
            v-if="queryExecuted"
            :displayed-grid-headers="displayedGridHeaders"
            :loading="loading"
            :result-entities="resultEntities as FlatEntity[]"
            :total-result-count="totalResultCount"
            :page-number="pageNumber"
            :page-size="pageSize"
            @grid-updated="gridUpdated"
        />
        <div v-else class="data-grid__init-screen">
            <p>Loaded query data must be manually executed.</p>
            <VBtn @click="executeQueryManually">
                Execute query
                <VActionTooltip :command="Command.EntityGrid_ExecuteQuery">
                    Execute query
                </VActionTooltip>
            </VBtn>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.data-grid {
    display: grid;
    grid-template-rows: 5.5rem 1fr;
    overflow-y: auto;

    &__init-screen {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 100%;
        gap: 1rem;
    }
}
</style>
