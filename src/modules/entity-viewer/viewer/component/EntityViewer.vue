<script setup lang="ts">
import { asError } from '@/utils/error'
/**
 * Entities console. Allows to view entities of specified collection.
 */

import 'splitpanes/dist/splitpanes.css'

import { computed, onBeforeMount, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { EntityViewerService, useEntityViewerService } from '@/modules/entity-viewer/viewer/service/EntityViewerService'
import type { Toaster } from '@/modules/notification/service/Toaster'
import { useToaster } from '@/modules/notification/service/Toaster'
import type { TabComponentProps } from '@/modules/workspace/tab/model/TabComponentProps'
import type { TabComponentEvents } from '@/modules/workspace/tab/model/TabComponentEvents'
import { EntityViewerTabParams } from '@/modules/entity-viewer/viewer/workspace/model/EntityViewerTabParams'
import { EntityViewerTabData } from '@/modules/entity-viewer/viewer/workspace/model/EntityViewerTabData'
import { EntityPropertyDescriptors } from '@/modules/entity-viewer/viewer/model/EntityPropertyDescriptors'
import { QueryLanguage } from '@/modules/entity-viewer/viewer/model/QueryLanguage'
import { QueryPriceMode } from '@/modules/entity-viewer/viewer/model/QueryPriceMode'
import { EntityPropertyKey } from '@/modules/entity-viewer/viewer/model/EntityPropertyKey'
import type { FlatEntity } from '@/modules/entity-viewer/viewer/model/FlatEntity'
import { EntityPropertyType } from '@/modules/entity-viewer/viewer/model/EntityPropertyType'
import type { QueryResult } from '@/modules/entity-viewer/viewer/model/QueryResult'
import { Command } from '@/modules/keymap/model/Command'
import VActionTooltip from '@/modules/base/component/VActionTooltip.vue'
import EntityGrid from '@/modules/entity-viewer/viewer/component/entity-grid/EntityGrid.vue'
import Toolbar from '@/modules/entity-viewer/viewer/component/Toolbar.vue'
import QueryInput from '@/modules/entity-viewer/viewer/component/QueryInput.vue'
import { List as ImmutableList } from 'immutable'
import { EntityAttributeSchema } from '@/modules/database-driver/request-response/schema/EntityAttributeSchema'
import {
    provideDataLocale,
    provideEntityPropertyDescriptors,
    provideSelectedScopes,
    providePriceType,
    provideQueryFilter,
    provideQueryLanguage,
    provideTabProps
} from '@/modules/entity-viewer/viewer/component/dependencies'
import type { TabComponentExpose } from '@/modules/workspace/tab/model/TabComponentExpose'
import { SubjectPath } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPath'
import { SubjectPathItem } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPathItem'
import {
    ConnectionSubjectPath
} from '@/modules/connection/workspace/status-bar/model/subject-path-status/ConnectionSubjectPath'
import { EntityViewerDataPointer } from '@/modules/entity-viewer/viewer/model/EntityViewerDataPointer'
import { EntityViewerTabDefinition } from '@/modules/entity-viewer/viewer/workspace/model/EntityViewerTabDefinition'
import { SelectableScope } from '@/modules/entity-viewer/viewer/model/SelectableScope'
import { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope.ts'
import { flattenToSingleLine } from '@/modules/code-editor/service/flattenToSingleLine'

const entityViewerService: EntityViewerService = useEntityViewerService()
const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<TabComponentProps<EntityViewerTabParams, EntityViewerTabData>>()
const emit = defineEmits<TabComponentEvents>()
provideTabProps(props!)
defineExpose<TabComponentExpose>({
    path(): SubjectPath | undefined {
        const dataPointer: EntityViewerDataPointer = props.params.dataPointer
        return new ConnectionSubjectPath(
            dataPointer.connection,
            [
                SubjectPathItem.plain(dataPointer.catalogName),
                SubjectPathItem.significant(EntityViewerTabDefinition.icon(), dataPointer.entityType)
            ]
        )
    },
    retry(): void {
        initialize()
    }
})

// static data
const title = ImmutableList.of(props.params.dataPointer.entityType)

const entityPropertyDescriptors = ref<EntityPropertyDescriptors>(EntityPropertyDescriptors.empty())
provideEntityPropertyDescriptors(entityPropertyDescriptors)
// registered at setup top level on purpose: a retry does not remount the component (the tab framework keeps
// it alive and only re-runs `initialize()`), so this registration must outlive every retry and is released
// exactly once, in `onUnmounted`
const entitySchemaChangedCallbackId: string = entityViewerService.registerEntitySchemaChangeCallback(
    props.params.dataPointer,
    async () => await reloadEntityPropertyDescriptors()
)

let dataLocales: ImmutableList<string> = ImmutableList()

// dynamic user data
const selectedQueryLanguage = ref<QueryLanguage>(props.data.queryLanguage ? props.data.queryLanguage : QueryLanguage.EvitaQL)
provideQueryLanguage(selectedQueryLanguage)
watch(selectedQueryLanguage, async (newValue, oldValue) => {
    if (newValue[0] === oldValue[0]) {
        return
    }

    // both codes hold language-specific source text and cannot be translated, unlike the grid sort state which is
    // language-agnostic and is therefore only regenerated into the new language
    filterByCode.value = ''
    orderByCode.value = ''
    orderByDefinedManually.value = false
    if (sortBy.value.length > 0) {
        await rebuildOrderByFromSortBy(sortBy.value)
    }

    await executeQueryAutomatically()
})

const loading = ref<boolean>(false)
const pageNumber = ref<number>(props.data.pageNumber ? props.data.pageNumber : 1)
const pageSize = ref<number>(props.data.pageSize ? props.data.pageSize : 25)

const filterByCode = ref<string>(props.data.filterBy ? flattenToSingleLine(props.data.filterBy) : '')
const lastAppliedFilterByCode = ref<string>('')
provideQueryFilter(lastAppliedFilterByCode)
const orderByCode = ref<string>(props.data.orderBy ? flattenToSingleLine(props.data.orderBy) : '')
/**
 * Grid sort state. Authoritative source of {@link orderByCode} unless {@link orderByDefinedManually} is `true`.
 */
const sortBy = ref<{ key: string, order?: 'asc' | 'desc' }[]>(props.data.sortBy ? props.data.sortBy : [])
/**
 * Whether {@link orderByCode} is text authored by the user. Grid-driven and hand-written ordering are mutually
 * exclusive: while this is `true`, {@link sortBy} is empty and the grid never overwrites the user's text.
 */
const orderByDefinedManually = ref<boolean>(props.data.orderByDefinedManually === true)
/**
 * Which writer currently owns {@link orderByCode}, surfaced to the user in the order by input.
 * `undefined` while no ordering is defined at all, when there is nothing to attribute.
 */
const orderByOwnership = computed<'grid' | 'manual' | undefined>(() => {
    if (orderByDefinedManually.value) {
        return orderByCode.value.length > 0 ? 'manual' : undefined
    }
    return sortBy.value.length > 0 ? 'grid' : undefined
})
const selectedScopes = ref<SelectableScope[]>(props.data.selectedScopes ? props.data.selectedScopes : [new SelectableScope(EntityScope.Live, true), new SelectableScope(EntityScope.Archive, false)])
provideSelectedScopes(selectedScopes)
/**
 * Scopes the query is actually executed in. Sortability of grid columns is resolved against these.
 */
const activeScopes = computed<EntityScope[]>(() => selectedScopes.value.filter(it => it.selected).map(it => it.scope))
watch(selectedScopes, async () => {
    await pruneSortsInvalidInSelectedScopes()

    await executeQueryManually()
})

const selectedDataLocale = ref<string | undefined>(props.data.dataLocale ? props.data.dataLocale : undefined)
provideDataLocale(selectedDataLocale)
watch(selectedDataLocale, () => executeQueryAutomatically())

const selectedPriceType = ref<QueryPriceMode>(props.data.priceType ? props.data.priceType : QueryPriceMode.WithTax)
watch(selectedPriceType, () => executeQueryAutomatically())
providePriceType(selectedPriceType)

/**
 * Properties displayed as grid columns, always in display order of {@link entityPropertyDescriptors} and made of
 * its own key instances: every writer passes the keys through `EntityPropertyDescriptors.order`.
 */
const selectedEntityProperties = ref<EntityPropertyKey[]>([])
watch(selectedEntityProperties, (newValue, oldValue) => {
    // re-fetch entities only if new properties were added, only in such case there could be missing data when displaying
    // the new properties
    if (newValue.length > oldValue.length) {
        executeQueryAutomatically()
    }
})

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
        selectedEntityProperties.value,
        pageSize.value,
        pageNumber.value,
        selectedScopes.value,
        sortBy.value,
        orderByDefinedManually.value
    )
})
watch(currentData, (data) => {
    emit('update:data', data)
})

/**
 * Loads everything the grid needs before it can render anything — data locales, property descriptors — and marks the tab ready. On any failure, including one of the calls exceeding the driver's call
 * deadline, reports the error to the tab framework so it can offer a retry, instead of leaving the tab stuck
 * behind the loading screen. Reused by both mount and retry.
 *
 * Note: we can't use async/await here, because that would make this component async which currently doesn't
 * seem to work properly in combination with dynamic <component> rendering and tabs.
 */
function initialize(): void {
    entityViewerService.getDataLocales(props.params.dataPointer)
        .then(dl => {
            dataLocales = dl.map(x => x.languageTag)
            return entityViewerService.getEntityPropertyDescriptors(props.params.dataPointer)
        })
        .then(ep => {
            entityPropertyDescriptors.value = ep
            // a restored tab may carry a sort that its own restored scopes no longer allow
            return pruneSortsInvalidInSelectedScopes()
        })
        .then(() => {
            preselectEntityProperties()
            initialized.value = true
            emit('ready')

            if (props.params.executeOnOpen) {
                executeQueryAutomatically()
            }
        })
        .catch(error => {
            emit('error', asError(error))
        })
}

onBeforeMount(() => {
    initialize()
})

async function reloadEntityPropertyDescriptors(): Promise<void> {
    entityPropertyDescriptors.value = await entityViewerService.getEntityPropertyDescriptors(props.params.dataPointer)
    // the schema change may have removed a property or its sortability while the grid is sorted by it
    await pruneSortsInvalidInSelectedScopes()

    // drops selected properties which are not available anymore and moves the remaining ones to their new position
    // and key instances
    selectedEntityProperties.value = entityPropertyDescriptors.value.order(selectedEntityProperties.value)
}

function preselectEntityProperties(): void {
    if (props.data.selectedProperties != undefined) {
        // preselect properties from initiator

        const notFoundProperties: string[] = props.data.selectedProperties
            .filter(propertyKey => !entityPropertyDescriptors.value.has(propertyKey))
            .map(propertyKey => propertyKey.toString())
        if (notFoundProperties.length > 0) {
            toaster.info(t(
                'entityViewer.grid.notification.failedToFindRequestedProperties',
                { keys: notFoundProperties.map(it => `'${it}'`).join(', ') }
            )).then()
        }

        selectedEntityProperties.value = entityPropertyDescriptors.value.order(props.data.selectedProperties)
    } else {
        // preselect default properties

        selectedEntityProperties.value = entityPropertyDescriptors.value.order(Array.from(entityPropertyDescriptors.value.index.values())
            .filter(it => it.key.type === EntityPropertyType.Entity ||
                it.key.type === EntityPropertyType.Prices ||
                (it.schema != undefined &&
                    it.schema instanceof EntityAttributeSchema &&
                    it.schema.representative))
            .map(it => it.key))
    }
}

/**
 * Regenerates {@link orderByCode} from the given grid sort state in the currently selected query language. Must be
 * called at every site that changes {@link sortBy} programmatically, because {@link gridUpdated} only rebuilds the
 * code for sorts initiated by the user.
 */
async function rebuildOrderByFromSortBy(columns: { key: string, order?: 'asc' | 'desc' }[]): Promise<void> {
    try {
        orderByCode.value = await entityViewerService.buildOrderByFromGridColumns(props.params.dataPointer, selectedQueryLanguage.value, columns)
    } catch (error) {
        await toaster.error(t('entityViewer.notification.couldNotBuildOrderBy'), asError(error))
    }
}

/**
 * Drops sorts by properties that are not sortable within the currently selected scopes and regenerates the order by
 * code accordingly. Sorts that remain valid are kept. Does nothing while the order by is owned by the user.
 */
async function pruneSortsInvalidInSelectedScopes(): Promise<void> {
    if (orderByDefinedManually.value || sortBy.value.length === 0) {
        return
    }
    const prunedSortBy = sortBy.value.filter(it =>
        entityPropertyDescriptors.value.get(it.key)?.isSortable(activeScopes.value) === true)
    if (prunedSortBy.length === sortBy.value.length) {
        return
    }
    await rebuildOrderByFromSortBy(prunedSortBy)
    sortBy.value = prunedSortBy
}

function isSameSortBy(left: { key: string, order?: 'asc' | 'desc' }[],
                      right: { key: string, order?: 'asc' | 'desc' }[]): boolean {
    return left.length === right.length &&
        left.every((it, index) => it.key === right[index]?.key && it.order === right[index]?.order)
}

async function gridUpdated({ page, itemsPerPage, sortBy: updatedSortBy }: {
    page: number,
    itemsPerPage: number,
    sortBy: { key: string, order?: 'asc' | 'desc' }[]
}): Promise<void> {
    const pageChanged: boolean = pageNumber.value !== page
    const pageSizeChanged: boolean = pageSize.value !== itemsPerPage
    // a differing sort can only come from the user clicking a column header; programmatic changes to `sortBy` already
    // rebuilt the order by code themselves and echo back here unchanged
    const sortChanged: boolean = !isSameSortBy(sortBy.value, updatedSortBy)

    pageNumber.value = page
    pageSize.value = itemsPerPage

    if (sortChanged) {
        // the user handed ownership of the ordering back to the grid
        orderByDefinedManually.value = false
        sortBy.value = updatedSortBy
        await rebuildOrderByFromSortBy(updatedSortBy)
    } else if (!pageChanged && !pageSizeChanged) {
        // nothing the query depends on has changed, do not re-execute it
        return
    }

    await executeQueryAutomatically()
}

/**
 * Handles the user editing the order by input (or picking a history record), which makes them the owner of the
 * ordering and discards the grid sort state.
 */
function orderByEdited(newOrderByCode: string): void {
    orderByCode.value = newOrderByCode
    orderByDefinedManually.value = true
    if (sortBy.value.length > 0) {
        sortBy.value = []
    }
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
            selectedScopes.value,
            selectedDataLocale.value,
            selectedPriceType.value,
            selectedEntityProperties.value,
            pageNumber.value,
            pageSize.value
        )
        resultEntities.value = result.entities
        totalResultCount.value = result.totalEntitiesCount

        lastAppliedFilterByCode.value = filterByCode.value
    } catch (error) {
        await toaster.error(t('entityViewer.notification.couldNotExecuteQuery'), asError(error))
    }

    loading.value = false
}

onUnmounted(() => {
    entityViewerService.unregisterEntitySchemaChangeCallback(
        props.params.dataPointer,
        entitySchemaChangedCallbackId
    )
})

</script>

<template>
    <div
        v-if="initialized"
        class="data-grid"
    >
        <Toolbar
            :icon="EntityViewerTabDefinition.icon()"
            :current-data="currentData"
            :title="title"
            :loading="loading"
            @execute-query="executeQueryManually"
        >
            <template #query>
                <QueryInput
                    v-model:selected-query-language="selectedQueryLanguage"
                    v-model:filter-by="filterByCode"
                    :order-by="orderByCode"
                    :order-by-ownership="orderByOwnership"
                    @update:order-by="orderByEdited"
                    v-model:selected-scopes="selectedScopes"
                    :data-locales="dataLocales"
                    v-model:selected-data-locale="selectedDataLocale"
                    v-model:selected-price-type="selectedPriceType"
                    v-model:selected-entity-properties="selectedEntityProperties"
                    @execute-query="executeQueryManually"
                />
            </template>
        </Toolbar>

        <EntityGrid
            v-if="queryExecuted"
            :selected-entity-properties="selectedEntityProperties"
            :active-scopes="activeScopes"
            :loading="loading"
            :result-entities="resultEntities as FlatEntity[]"
            :total-result-count="totalResultCount"
            :page-number="pageNumber"
            :page-size="pageSize"
            :sort-by="sortBy"
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
