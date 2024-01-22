<script setup lang="ts">
/**
 * Query input for the LabEditorDataGrid component.
 */

import VSingleLineCodeMirror from '@/components/base/VSingleLineCodemirror.vue'
import { QueryLanguage, UnexpectedError } from '@/model/lab'
import { computed, ref, watch } from 'vue'
import LabEditorDataGridEntityPropertySelector
    from '@/components/lab/editor/data-grid/property-selector/LabEditorDataGridPropertySelector.vue'
import {
    EntityPropertyKey, gridParamsKey
} from '@/model/editor/data-grid'
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
import {
    createFilterByHistoryKey, createOrderByByHistoryKey,
    FilterByHistoryKey,
    FilterByHistoryRecord, OrderByHistoryKey, OrderByHistoryRecord
} from '@/model/editor/tab/data-grid/history'
import { mandatoryInject } from '@/helpers/reactivity'
import { EditorService, useEditorService } from '@/services/editor/editor.service'
import { Toaster, useToaster } from '@/services/editor/toaster'

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
const gridParams = mandatoryInject(gridParamsKey)

// todo this approach to autocompletion in grid is temporary until i'm able to pass the entire query with cropped view
const filterByInputView = ref<EditorView>()
const filterByInputLangSupportCompartment = new Compartment()
const filterByInputExtensions: Extension[] = [filterByInputLangSupportCompartment.of(createFilterByLangSupportExtension(props.selectedQueryLanguage))]
const filterByHistoryKey = computed<FilterByHistoryKey>(() => createFilterByHistoryKey(gridParams.dataPointer))
const filterByHistoryRecords = computed<FilterByHistoryRecord[]>(() => {
    return [...editorService.getTabHistoryRecords(filterByHistoryKey.value)].reverse()
})

const orderByInputView = ref<EditorView>()
const orderByInputLangSupportCompartment = new Compartment()
const orderByInputExtensions: Extension[] = [orderByInputLangSupportCompartment.of(createOrderByLangSupportExtension(props.selectedQueryLanguage))]
const orderByHistoryKey = computed<OrderByHistoryKey>(() => createOrderByByHistoryKey(gridParams.dataPointer))
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

const showPropertiesSelect = ref<boolean>(false)

function executeQuery(): void {
    try {
        editorService.addTabHistoryRecord(filterByHistoryKey.value, props.filterBy)
        editorService.addTabHistoryRecord(orderByHistoryKey.value, props.orderBy)
    } catch (e) {
        console.error(e)
        toaster.error(new UnexpectedError(gridParams.dataPointer.connection, 'Failed to save query to history.'))
    }
    emit('executeQuery')
}
</script>

<template>
    <div class="query-input">
        <LabEditorDataGridQueryLanguageSelector
            :selected="selectedQueryLanguage"
            @update:selected="emit('update:selectedQueryLanguage', $event)"
        />

        <div class="query-input__input">
            <VSingleLineCodeMirror
                :model-value="filterBy"
                prepend-inner-icon="mdi-filter-menu-outline"
                placeholder="Filter by"
                @update:model-value="emit('update:filterBy', $event)"
                @update:history-clear="editorService.clearTabHistory(filterByHistoryKey)"
                @update:editor="filterByInputView = $event.view"
                :additional-extensions="filterByInputExtensions"
                :history-records="filterByHistoryRecords"
                @execute="executeQuery"
                class="text-gray-light"
            />
        </div>

        <div class="query-input__input">
            <VSingleLineCodeMirror
                :model-value="orderBy"
                prepend-inner-icon="mdi-sort"
                placeholder="Order by"
                @update:model-value="emit('update:orderBy', $event)"
                @update:history-clear="editorService.clearTabHistory(orderByHistoryKey)"
                @update:editor="orderByInputView = $event.view"
                :additional-extensions="orderByInputExtensions"
                :history-records="orderByHistoryRecords"
                @execute="executeQuery"
                class="text-gray-light"
            />
        </div>

        <div class="query-input__selectors">
            <LabEditorDataGridDataLocaleSelector
                :selected="selectedDataLocale"
                @update:selected="emit('update:selectedDataLocale', $event)"
                :data-locales="dataLocales"
            />
            <LabEditorDataGridDataPriceTypeSelector
                v-if="selectedPriceType != undefined"
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
