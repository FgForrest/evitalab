<script setup lang="ts">
/**
 * Query input for the LabEditorDataGrid component.
 */

import { QueryLanguage, UnexpectedError } from '@/model/lab'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import LabEditorDataGridEntityPropertySelector
    from '@/components/lab/editor/data-grid/property-selector/LabEditorDataGridPropertySelector.vue'
import LabEditorDataGridDataLocaleSelector
    from '@/components/lab/editor/data-grid/LabEditorDataGridDataLocaleSelector.vue'
import LabEditorDataGridQueryLanguageSelector
    from '@/components/lab/editor/data-grid/LabEditorDataGridQueryLanguageSelector.vue'
import { Compartment, Extension } from '@codemirror/state'
import { ConstraintListType, evitaQL, EvitaQLConstraintListMode } from '@lukashornych/codemirror-lang-evitaql'
import { EditorView } from 'codemirror'
import LabEditorDataGridDataPriceTypeSelector
    from '@/components/lab/editor/data-grid/LabEditorDataGridDataPriceTypeSelector.vue'
import { QueryPriceMode } from '@/model/evitadb'
import { mandatoryInject } from '@/helpers/reactivity'
import { EditorService, useEditorService } from '@/services/editor/editor.service'
import { Toaster, useToaster } from '@/services/editor/toaster'
import VInlineQueryEditor from '@/components/base/VInlineQueryEditor.vue'
import { Keymap, useKeymap } from '@/model/editor/keymap/Keymap'
import { Command } from '@/model/editor/keymap/Command'
import { FilterByHistoryRecord } from '@/model/editor/tab/dataGrid/history/FilterByHistoryRecord'
import { createFilterByHistoryKey, FilterByHistoryKey } from '@/model/editor/tab/dataGrid/history/FilterByHistoryKey'
import { OrderByHistoryRecord } from '@/model/editor/tab/dataGrid/history/OrderByHistoryRecord'
import { createOrderByByHistoryKey, OrderByHistoryKey } from '@/model/editor/tab/dataGrid/history/OrderByHistoryKey'
import { EntityPropertyKey, gridPropsKey } from '@/model/editor/tab/dataGrid/data-grid'
import keymaster from 'keymaster'
import { propertySelectorScope } from '@/model/editor/tab/dataGrid/keymap/scopes'

const keymap: Keymap = useKeymap()
const editorService: EditorService = useEditorService()
const toaster: Toaster = useToaster()

const props = defineProps<{
    selectedQueryLanguage: QueryLanguage,
    filterBy: string,
    orderBy: string,
    dataLocales: string[],
    selectedDataLocale: string | undefined,
    selectedPriceType: QueryPriceMode | undefined,
    selectedEntityPropertyKeys: EntityPropertyKey[]
}>()
const emit = defineEmits<{
    (e: 'executeQuery'): void
    (e: 'update:selectedQueryLanguage', value: QueryLanguage | undefined): void
    (e: 'update:filterBy', value: string): void
    (e: 'update:orderBy', value: string): void
    (e: 'update:selectedDataLocale', value: string | undefined): void
    (e: 'update:selectedPriceType', value: QueryPriceMode): void
    (e: 'update:selectedEntityPropertyKeys', value: EntityPropertyKey[]): void
}>()
const gridProps = mandatoryInject(gridPropsKey)

const queryLanguageSelectorRef = ref<InstanceType<typeof LabEditorDataGridQueryLanguageSelector> | undefined>()

// todo this approach to autocompletion in grid is temporary until i'm able to pass the entire query with cropped view
const filterByInputView = ref<EditorView>()
const filterByInputLangSupportCompartment = new Compartment()
const filterByInputExtensions: Extension[] = [filterByInputLangSupportCompartment.of(createFilterByLangSupportExtension(props.selectedQueryLanguage))]
const filterByHistoryKey = computed<FilterByHistoryKey>(() => createFilterByHistoryKey(gridProps.params.dataPointer))
const filterByHistoryRecords = computed<FilterByHistoryRecord[]>(() => {
    return [...editorService.getTabHistoryRecords(filterByHistoryKey.value)].reverse()
})

const orderByInputView = ref<EditorView>()
const orderByInputLangSupportCompartment = new Compartment()
const orderByInputExtensions: Extension[] = [orderByInputLangSupportCompartment.of(createOrderByLangSupportExtension(props.selectedQueryLanguage))]
const orderByHistoryKey = computed<OrderByHistoryKey>(() => createOrderByByHistoryKey(gridProps.params.dataPointer))
const orderByHistoryRecords = computed<OrderByHistoryRecord[]>(() => {
    return [...editorService.getTabHistoryRecords(orderByHistoryKey.value)].reverse()
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

const dataLocaleSelectorRef = ref<InstanceType<typeof LabEditorDataGridDataLocaleSelector> | undefined>()
const priceTypeSelectorRef = ref<InstanceType<typeof LabEditorDataGridDataPriceTypeSelector> | undefined>()

const showPropertiesSelect = ref<boolean>(false)
watch(showPropertiesSelect, (newValue) => {
    if (newValue) {
        keymap.pushScope(gridProps.id, propertySelectorScope)
    } else {
        keymap.popScope(gridProps.id)
    }
})

function executeQuery(): void {
    try {
        editorService.addTabHistoryRecord(filterByHistoryKey.value, props.filterBy)
        editorService.addTabHistoryRecord(orderByHistoryKey.value, props.orderBy)
    } catch (e) {
        console.error(e)
        toaster.error(new UnexpectedError(gridProps.params.dataPointer.connection, 'Failed to save query to history.'))
    }
    emit('executeQuery')
}

onMounted(() => {
    // register grid specific keyboard shortcuts
    keymap.bind(Command.EntityGrid_ExecuteQuery, gridProps.id, () => executeQuery())
    keymap.bind(Command.EntityGrid_ChangeQueryLanguage, gridProps.id, () => queryLanguageSelectorRef.value?.focus())
    keymap.bind(Command.EntityGrid_FocusFilterInput, gridProps.id, () => filterByInputView.value?.focus())
    keymap.bind(Command.EntityGrid_FocusOrderInput, gridProps.id, () => orderByInputView.value?.focus())
    keymap.bind(Command.EntityGrid_ChangeDataLocale, gridProps.id, () => dataLocaleSelectorRef.value?.focus())
    keymap.bind(Command.EntityGrid_ChangePriceType, gridProps.id, () => priceTypeSelectorRef.value?.focus())
    keymap.bind(Command.EntityGrid_OpenPropertySelector, gridProps.id, () => showPropertiesSelect.value = true)
})
onUnmounted(() => {
    // unregister grid specific keyboard shortcuts
    keymap.unbind(Command.EntityGrid_ExecuteQuery, gridProps.id)
    keymap.unbind(Command.EntityGrid_ChangeQueryLanguage, gridProps.id)
    keymap.unbind(Command.EntityGrid_FocusFilterInput, gridProps.id)
    keymap.unbind(Command.EntityGrid_FocusOrderInput, gridProps.id)
    keymap.unbind(Command.EntityGrid_ChangeDataLocale, gridProps.id)
    keymap.unbind(Command.EntityGrid_ChangePriceType, gridProps.id)
    keymap.unbind(Command.EntityGrid_OpenPropertySelector, gridProps.id)
})
</script>

<template>
    <div class="query-input">
        <LabEditorDataGridQueryLanguageSelector
            ref="queryLanguageSelectorRef"
            :selected="selectedQueryLanguage"
            @update:selected="emit('update:selectedQueryLanguage', $event)"
        />

        <div class="query-input__input">
            <VInlineQueryEditor
                :model-value="filterBy"
                prepend-inner-icon="mdi-filter-menu-outline"
                :placeholder="`Filter by (${keymap.prettyPrint(Command.EntityGrid_FocusFilterInput)})`"
                @update:model-value="emit('update:filterBy', $event)"
                @update:history-clear="editorService.clearTabHistory(filterByHistoryKey)"
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
                :placeholder="`Order by (${keymap.prettyPrint(Command.EntityGrid_FocusOrderInput)})`"
                @update:model-value="emit('update:orderBy', $event)"
                @update:history-clear="editorService.clearTabHistory(orderByHistoryKey)"
                @update:editor="orderByInputView = $event.view"
                :additional-extensions="orderByInputExtensions"
                :history-records="orderByHistoryRecords"
                class="text-gray-light"
            />
        </div>

        <div class="query-input__selectors">
            <LabEditorDataGridDataLocaleSelector
                ref="dataLocaleSelectorRef"
                :selected="selectedDataLocale"
                @update:selected="emit('update:selectedDataLocale', $event)"
                :data-locales="dataLocales"
            />
            <LabEditorDataGridDataPriceTypeSelector
                v-if="selectedPriceType != undefined"
                ref="priceTypeSelectorRef"
                :selected="selectedPriceType"
                @update:selected="emit('update:selectedPriceType', $event)"
            />

            <LabEditorDataGridEntityPropertySelector
                v-model="showPropertiesSelect"
                :selected="selectedEntityPropertyKeys"
                @update:selected="emit('update:selectedEntityPropertyKeys', $event)"
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
