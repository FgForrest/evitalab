<script setup lang="ts">
/**
 * Query input for the LabEditorDataGrid component.
 */

import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { Compartment, Extension } from '@codemirror/state'
import { ConstraintListType, evitaQL, EvitaQLConstraintListMode } from '@lukashornych/codemirror-lang-evitaql'
import { EditorView } from 'codemirror'
import { useI18n } from 'vue-i18n'
import { Keymap, useKeymap } from '@/modules/keymap/service/Keymap'
import { useWorkspaceService, WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import { Toaster, useToaster } from '@/modules/notification/service/Toaster'
import { QueryLanguage } from '@/modules/entity-viewer/viewer/model/QueryLanguage'
import { QueryPriceMode } from '@/modules/entity-viewer/viewer/model/QueryPriceMode'
import { EntityPropertyKey } from '@/modules/entity-viewer/viewer/model/EntityPropertyKey'
import QueryLanguageSelector from '@/modules/entity-viewer/viewer/component/QueryLanguageSelector.vue'
import { createFilterByHistoryKey, FilterByHistoryKey } from '@/modules/entity-viewer/viewer/history/FilterByHistoryKey'
import { FilterByHistoryRecord } from '@/modules/entity-viewer/viewer/history/FilterByHistoryRecord'
import { createOrderByByHistoryKey, OrderByHistoryKey } from '@/modules/entity-viewer/viewer/history/OrderByHistoryKey'
import { OrderByHistoryRecord } from '@/modules/entity-viewer/viewer/history/OrderByHistoryRecord'
import LocaleSelector from '@/modules/entity-viewer/viewer/component/LocaleSelector.vue'
import PriceTypeSelector from '@/modules/entity-viewer/viewer/component/PriceTypeSelector.vue'
import { propertySelectorScope } from '@/modules/entity-viewer/viewer/keymap/scopes'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { Command } from '@/modules/keymap/model/Command'
import VInlineQueryEditor from '@/modules/code-editor/component/VInlineQueryEditor.vue'
import EntityPropertySelector
    from '@/modules/entity-viewer/viewer/component/entity-property-selector/EntityPropertySelector.vue'
import { useTabProps } from '@/modules/entity-viewer/viewer/component/dependencies'
import { List } from 'immutable'
import { EntityViewerService, useEntityViewerService } from '@/modules/entity-viewer/viewer/service/EntityViewerService'

const keymap: Keymap = useKeymap()
const workspaceService: WorkspaceService = useWorkspaceService()
const entityViewerService: EntityViewerService = useEntityViewerService()
const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<{
    selectedQueryLanguage: QueryLanguage,
    filterBy: string,
    orderBy: string,
    dataLocales: List<string>,
    selectedDataLocale: string | undefined,
    selectedPriceType: QueryPriceMode,
    displayedEntityProperties: EntityPropertyKey[]
}>()
const emit = defineEmits<{
    (e: 'executeQuery'): void
    (e: 'update:selectedQueryLanguage', value: QueryLanguage | undefined): void
    (e: 'update:filterBy', value: string): void
    (e: 'update:orderBy', value: string): void
    (e: 'update:selectedDataLocale', value: string | undefined): void
    (e: 'update:selectedPriceType', value: QueryPriceMode): void
    (e: 'update:displayedEntityProperties', value: EntityPropertyKey[]): void
}>()
const tabProps = useTabProps()

const queryLanguageSelectorRef = ref<InstanceType<typeof QueryLanguageSelector> | undefined>()

// todo this approach to autocompletion in grid is temporary until i'm able to pass the entire query with cropped view
const filterByInputView = ref<EditorView>()
const filterByInputLangSupportCompartment = new Compartment()
const filterByInputExtensions: Extension[] = [filterByInputLangSupportCompartment.of(createFilterByLangSupportExtension(props.selectedQueryLanguage))]
const filterByHistoryKey = computed<FilterByHistoryKey>(() => createFilterByHistoryKey(tabProps.params.dataPointer))
const filterByHistoryRecords = computed<FilterByHistoryRecord[]>(() => {
    return [...workspaceService.getTabHistoryRecords(filterByHistoryKey.value)].reverse()
})

const orderByInputView = ref<EditorView>()
const orderByInputLangSupportCompartment = new Compartment()
const orderByInputExtensions: Extension[] = [orderByInputLangSupportCompartment.of(createOrderByLangSupportExtension(props.selectedQueryLanguage))]
const orderByHistoryKey = computed<OrderByHistoryKey>(() => createOrderByByHistoryKey(tabProps.params.dataPointer))
const orderByHistoryRecords = computed<OrderByHistoryRecord[]>(() => {
    return [...workspaceService.getTabHistoryRecords(orderByHistoryKey.value)].reverse()
})

watch(() => props.selectedQueryLanguage, (newValue) => {
    filterByInputView.value?.dispatch({
        effects: filterByInputLangSupportCompartment.reconfigure(createFilterByLangSupportExtension(newValue))
    })
    orderByInputView.value?.dispatch({
        effects: orderByInputLangSupportCompartment.reconfigure(createOrderByLangSupportExtension(newValue))
    })
})

function createFilterByLangSupportExtension(queryLanguage: QueryLanguage): Extension {
    if (queryLanguage === QueryLanguage.EvitaQL) {
        return evitaQL({ mode: new EvitaQLConstraintListMode(ConstraintListType.Filter) })
    } else {
        return []
    }
}

function createOrderByLangSupportExtension(queryLanguage: QueryLanguage): Extension {
    if (queryLanguage === QueryLanguage.EvitaQL) {
        return evitaQL({ mode: new EvitaQLConstraintListMode(ConstraintListType.Order) })
    } else {
        return []
    }
}

const dataLocaleSelectorRef = ref<InstanceType<typeof LocaleSelector> | undefined>()
const supportsPrices = ref<boolean>(false)
const priceTypeSelectorRef = ref<InstanceType<typeof PriceTypeSelector> | undefined>()
entityViewerService.supportsPrices(tabProps.params.dataPointer)
    .then(it => supportsPrices.value = it)

const showPropertiesSelect = ref<boolean>(false)
watch(showPropertiesSelect, (newValue) => {
    if (newValue) {
        keymap.pushScope(tabProps.id, propertySelectorScope)
    } else {
        keymap.popScope(tabProps.id)
    }
})

async function executeQuery(): Promise<void> {
    try {
        workspaceService.addTabHistoryRecord(filterByHistoryKey.value, props.filterBy)
        workspaceService.addTabHistoryRecord(orderByHistoryKey.value, props.orderBy)
    } catch (e: any) {
        await toaster.error(t('entityViewer.queryInput.notification.failedToSaveQueryToHistory', e))
    }
    emit('executeQuery')
}

onMounted(() => {
    // register grid specific keyboard shortcuts
    keymap.bind(Command.EntityViewer_ExecuteQuery, tabProps.id, () => executeQuery())
    keymap.bind(Command.EntityViewer_ChangeQueryLanguage, tabProps.id, () => queryLanguageSelectorRef.value?.focus())
    keymap.bind(Command.EntityViewer_FilterBy, tabProps.id, () => filterByInputView.value?.focus())
    keymap.bind(Command.EntityViewer_OrderBy, tabProps.id, () => orderByInputView.value?.focus())
    keymap.bind(Command.EntityViewer_ChangeDataLocale, tabProps.id, () => dataLocaleSelectorRef.value?.focus())
    keymap.bind(Command.EntityViewer_ChangePriceType, tabProps.id, () => priceTypeSelectorRef.value?.focus())
    keymap.bind(Command.EntityViewer_OpenPropertySelector, tabProps.id, () => showPropertiesSelect.value = true)
})
onUnmounted(() => {
    // unregister grid specific keyboard shortcuts
    keymap.unbind(Command.EntityViewer_ExecuteQuery, tabProps.id)
    keymap.unbind(Command.EntityViewer_ChangeQueryLanguage, tabProps.id)
    keymap.unbind(Command.EntityViewer_FilterBy, tabProps.id)
    keymap.unbind(Command.EntityViewer_OrderBy, tabProps.id)
    keymap.unbind(Command.EntityViewer_ChangeDataLocale, tabProps.id)
    keymap.unbind(Command.EntityViewer_ChangePriceType, tabProps.id)
    keymap.unbind(Command.EntityViewer_OpenPropertySelector, tabProps.id)
})
</script>

<template>
    <div class="query-input">
        <QueryLanguageSelector
            ref="queryLanguageSelectorRef"
            :selected="selectedQueryLanguage"
            @update:selected="emit('update:selectedQueryLanguage', $event)"
        />

        <div class="query-input__input">
            <VInlineQueryEditor
                :model-value="filterBy"
                prepend-inner-icon="mdi-filter-menu-outline"
                :placeholder="`Filter by (${keymap.prettyPrint(Command.EntityViewer_FilterBy)})`"
                @update:model-value="emit('update:filterBy', $event)"
                @update:history-clear="workspaceService.clearTabHistory(filterByHistoryKey)"
                @update:editor="filterByInputView = $event.view"
                :additional-extensions="filterByInputExtensions"
                :history-records="filterByHistoryRecords"
                class="text-gray-light"
            />
        </div>

        <div class="query-input__input">
            <VInlineQueryEditor
                :model-value="orderBy"
                prepend-inner-icon="mdi-sort"
                :placeholder="`Order by (${keymap.prettyPrint(Command.EntityViewer_OrderBy)})`"
                @update:model-value="emit('update:orderBy', $event)"
                @update:history-clear="workspaceService.clearTabHistory(orderByHistoryKey)"
                @update:editor="orderByInputView = $event.view"
                :additional-extensions="orderByInputExtensions"
                :history-records="orderByHistoryRecords"
                class="text-gray-light"
            />
        </div>

        <div class="query-input__selectors">
            <LocaleSelector
                ref="dataLocaleSelectorRef"
                :selected="selectedDataLocale"
                @update:selected="emit('update:selectedDataLocale', $event)"
                :data-locales="dataLocales"
            />
            <PriceTypeSelector
                v-if="supportsPrices"
                ref="priceTypeSelectorRef"
                :selected="selectedPriceType"
                @update:selected="emit('update:selectedPriceType', $event)"
            />

            <EntityPropertySelector
                v-model="showPropertiesSelect"
                :selected="displayedEntityProperties"
                @update:selected="emit('update:displayedEntityProperties', $event)"
                @schema-open="showPropertiesSelect = false"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>
.query-input {
    width: 100%;
    height: 2.5rem;
    display: grid;
    grid-template-columns: 2.25rem 0.65fr 0.35fr auto;
    column-gap: 0.375rem;
    margin: 0 0.375rem;
    align-items: center;
    justify-items: stretch;

    &__input {
        display: inline-grid;
        margin: 0 0.25rem;
    }

    &__selectors {
        display: flex;
        column-gap: 0.375rem;
    }
}
</style>
