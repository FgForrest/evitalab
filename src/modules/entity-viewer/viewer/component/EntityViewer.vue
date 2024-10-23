<script setup lang="ts">
/**
 * Entities console. Allows to view entities of specified collection.
 */

import 'splitpanes/dist/splitpanes.css'

import { computed, onBeforeMount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { EntityViewerService, useEntityViewerService } from '@/modules/entity-viewer/viewer/service/EntityViewerService'
import { Toaster, useToaster } from '@/modules/notification/service/Toaster'
import { TabComponentProps } from '@/modules/workspace/tab/model/TabComponentProps'
import { TabComponentEvents } from '@/modules/workspace/tab/model/TabComponentEvents'
import { EntityViewerTabParams } from '@/modules/entity-viewer/viewer/workspace/model/EntityViewerTabParams'
import { EntityViewerTabData } from '@/modules/entity-viewer/viewer/workspace/model/EntityViewerTabData'
import { EntityPropertyDescriptor } from '@/modules/entity-viewer/viewer/model/EntityPropertyDescriptor'
import { QueryLanguage } from '@/modules/entity-viewer/viewer/model/QueryLanguage'
import { QueryPriceMode } from '@/modules/entity-viewer/viewer/model/QueryPriceMode'
import { EntityPropertyKey } from '@/modules/entity-viewer/viewer/model/EntityPropertyKey'
import { FlatEntity } from '@/modules/entity-viewer/viewer/model/FlatEntity'
import { EntityPropertyType } from '@/modules/entity-viewer/viewer/model/EntityPropertyType'
import { QueryResult } from '@/modules/entity-viewer/viewer/model/QueryResult'
import { Command } from '@/modules/keymap/model/Command'
import VActionTooltip from '@/modules/base/component/VActionTooltip.vue'
import EntityGrid from '@/modules/entity-viewer/viewer/component/entity-grid/EntityGrid.vue'
import Toolbar from '@/modules/entity-viewer/viewer/component/Toolbar.vue'
import QueryInput from '@/modules/entity-viewer/viewer/component/QueryInput.vue'
import Immutable, { List } from 'immutable'
import { EntityAttributeSchema } from '@/modules/connection/model/schema/EntityAttributeSchema'
import {
    provideDataLocale,
    provideEntityPropertyDescriptorIndex,
    providePriceType,
    provideQueryFilter,
    provideQueryLanguage,
    provideTabProps
} from '@/modules/entity-viewer/viewer/component/dependencies'

const entityViewerService: EntityViewerService = useEntityViewerService()
const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<TabComponentProps<EntityViewerTabParams, EntityViewerTabData>>()
const emit = defineEmits<TabComponentEvents>()
provideTabProps(props!)

// static data
const path = List([
    props.params.dataPointer.catalogName,
    props.params.dataPointer.entityType
])

let sortedEntityPropertyKeys: string[] = []
let entityPropertyDescriptors: EntityPropertyDescriptor[] = []
const entityPropertyDescriptorIndex = ref<Immutable.Map<string, EntityPropertyDescriptor>>(Immutable.Map<string, EntityPropertyDescriptor>())
provideEntityPropertyDescriptorIndex(entityPropertyDescriptorIndex)

let gridHeaders: Map<string, any> = new Map<string, any>()
let dataLocales: List<string> = List()

// dynamic user data
const selectedQueryLanguage = ref<QueryLanguage>(props.data.queryLanguage ? props.data.queryLanguage : QueryLanguage.EvitaQL)
provideQueryLanguage(selectedQueryLanguage)
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
provideQueryFilter(lastAppliedFilterByCode)
const orderByCode = ref<string>(props.data.orderBy ? props.data.orderBy : '')

const selectedDataLocale = ref<string | undefined>(props.data.dataLocale ? props.data.dataLocale : undefined)
provideDataLocale(selectedDataLocale)
watch(selectedDataLocale, () => executeQueryAutomatically())

const selectedPriceType = ref<QueryPriceMode>(props.data.priceType ? props.data.priceType : QueryPriceMode.WithTax)
watch(selectedPriceType, () => executeQueryAutomatically())
providePriceType(selectedPriceType)

const displayedEntityProperties = ref<EntityPropertyKey[]>([])
watch(displayedEntityProperties, (newValue, oldValue) => {
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

const currentData = computed<EntityViewerTabData>(() => {
    return new EntityViewerTabData(
        selectedQueryLanguage.value,
        filterByCode.value,
        orderByCode.value,
        selectedDataLocale.value,
        displayedEntityProperties.value,
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

    entityViewerService.getDataLocales(props.params.dataPointer)
        .then(dl => {
            dataLocales = dl.map(x => x.languageTag)
            return entityViewerService.getEntityPropertyDescriptors(props.params.dataPointer)
        })
        .then(ep => {
            entityPropertyDescriptors = ep
            const entityPropertyDescriptorIndexBuilder: Map<string, EntityPropertyDescriptor> = new Map()
            for (const entityPropertyDescriptor of entityPropertyDescriptors) {
                entityPropertyDescriptorIndexBuilder.set(entityPropertyDescriptor.key.toString(), entityPropertyDescriptor)
                entityPropertyDescriptor.children.forEach(childPropertyDescriptor => {
                    entityPropertyDescriptorIndexBuilder.set(childPropertyDescriptor.key.toString(), childPropertyDescriptor)
                })

                sortedEntityPropertyKeys.push(entityPropertyDescriptor.key.toString())
                for (const childEntityPropertyDescriptor of entityPropertyDescriptor.children) {
                    sortedEntityPropertyKeys.push(childEntityPropertyDescriptor.key.toString())
                }
            }
            entityPropertyDescriptorIndex.value = Immutable.Map(entityPropertyDescriptorIndexBuilder)
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
                    sortable: childPropertyDescriptor.isSortable(),
                    descriptor: childPropertyDescriptor
                }
            )
        }
    }
    return gridHeaders
}

async function updateDisplayedGridHeaders(): Promise<void> {
    displayedGridHeaders.value = displayedEntityProperties.value.map(propertyKey => gridHeaders.get(propertyKey.toString()))

    // sort grid headers by entity properties order
    displayedGridHeaders.value.sort((a, b) => {
        return sortedEntityPropertyKeys.indexOf(a.key.toString()) - sortedEntityPropertyKeys.indexOf(b.key.toString())
    })
}

function preselectEntityProperties(): void {
    if (props.data.displayedProperties != undefined) {
        // preselect properties from initiator

        const notFoundProperties: string[] = []
        displayedEntityProperties.value = props.data.displayedProperties
                ?.filter(propertyKey => {
                    const propertyFound: boolean = entityPropertyDescriptorIndex.value.get(propertyKey.toString()) != undefined
                    if (!propertyFound) {
                        notFoundProperties.push(propertyKey.toString())
                    }
                    return propertyFound
                })
                ?.map(it => {
                    // we need instances created by the grid because javascript cannot do proper equals so the properties
                    // coming from outside doesn't match these and we need to work with object not just string representation
                    return entityPropertyDescriptorIndex.value.get(it.toString())!.key
                })
            || []

        if (notFoundProperties.length > 0) {
            toaster.info(t(
                'entityViewer.grid.notification.failedToFindRequestedProperties',
                { keys: notFoundProperties.map(it => `'${it}'`).join(', ') }
            ))
        }
    } else {
        // preselect default properties

        displayedEntityProperties.value = entityPropertyDescriptors
            .filter(it => it.key.type === EntityPropertyType.Entity ||
                it.key.type === EntityPropertyType.Prices ||
                (it.schema != undefined &&
                    it.schema instanceof EntityAttributeSchema &&
                    it.schema.representative.getOrElse(false)))
            .map(it => it.key)
    }

}

async function gridUpdated({ page, itemsPerPage, sortBy }: { page: number, itemsPerPage: number, sortBy: any[] }): Promise<void> {
    pageNumber.value = page
    pageSize.value = itemsPerPage
    if (sortBy.length > 0) {
        try {
            orderByCode.value = await entityViewerService.buildOrderByFromGridColumns(props.params.dataPointer, selectedQueryLanguage.value, sortBy)
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
        const result: QueryResult = await entityViewerService.executeQuery(
            props.params.dataPointer,
            selectedQueryLanguage.value,
            filterByCode.value,
            orderByCode.value,
            selectedDataLocale.value,
            selectedPriceType.value,
            displayedEntityProperties.value,
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
        <Toolbar
            :current-data="currentData"
            :path="path"
            :loading="loading"
            @execute-query="executeQueryManually"
        >
            <template #query>
                <QueryInput
                    v-model:selected-query-language="selectedQueryLanguage"
                    v-model:filter-by="filterByCode"
                    v-model:order-by="orderByCode"
                    :data-locales="dataLocales"
                    v-model:selected-data-locale="selectedDataLocale"
                    v-model:selected-price-type="selectedPriceType"
                    v-model:displayed-entity-properties="displayedEntityProperties"
                    @execute-query="executeQueryManually"
                />
            </template>
        </Toolbar>

        <EntityGrid
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
            <p>{{ t('entityViewer.loadedDataWarning') }}</p>
            <VBtn @click="executeQueryManually">
                {{ t('common.button.executeQuery') }}
                <VActionTooltip :command="Command.EntityViewer_ExecuteQuery"/>
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
