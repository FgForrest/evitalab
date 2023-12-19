<script setup lang="ts">
/**
 * Query input for the LabEditorDataGrid component.
 */

import VSingleLineCodeMirror from '@/components/base/VSingleLineCodemirror.vue'
import { QueryLanguage } from '@/model/lab'
import { ref, watch } from 'vue'
import LabEditorDataGridEntityPropertySelector
    from '@/components/lab/editor/data-grid/property-selector/LabEditorDataGridPropertySelector.vue'
import {
    DataGridConsoleData, DataGridConsoleParams,
    EntityPropertyDescriptor,
    EntityPropertyKey
} from '@/model/editor/data-grid'
import LabEditorDataGridDataLocaleSelector
    from '@/components/lab/editor/data-grid/LabEditorDataGridDataLocaleSelector.vue'
import LabEditorDataGridQueryLanguageSelector
    from '@/components/lab/editor/data-grid/LabEditorDataGridQueryLanguageSelector.vue'
import { TabComponentProps } from '@/model/editor/editor'
import { Compartment, Extension } from '@codemirror/state'
import { ConstraintListType, evitaQL, EvitaQLConstraintListMode } from '@lukashornych/codemirror-lang-evitaql'
import { EditorView } from 'codemirror'

const props = defineProps<{
    gridProps: TabComponentProps<DataGridConsoleParams, DataGridConsoleData>,
    selectedQueryLanguage: QueryLanguage,
    filterBy: string,
    orderBy: string,
    dataLocales: string[],
    selectedDataLocale: string | undefined,
    entityPropertyDescriptorIndex: Map<string, EntityPropertyDescriptor>,
    selectedEntityPropertyKeys: EntityPropertyKey[]
}>()
const emit = defineEmits<{
    (e: 'executeQuery'): void
    (e: 'update:selectedQueryLanguage', value: QueryLanguage | undefined): void
    (e: 'update:filterBy', value: string): void
    (e: 'update:orderBy', value: string): void
    (e: 'update:selectedDataLocale', value: string | undefined): void
    (e: 'update:selectedEntityPropertyKeys', value: EntityPropertyKey[]): void
}>()

// todo this approach to autocompletion in grid is temporary until i'm able to pass the entire query with cropped view
const filterByInputView = ref<EditorView>()
const filterByInputLangSupportCompartment = new Compartment()
const filterByInputExtensions: Extension[] = [filterByInputLangSupportCompartment.of(createFilterByLangSupportExtension(props.selectedQueryLanguage))]

const orderByInputView = ref<EditorView>()
const orderByInputLangSupportCompartment = new Compartment()
const orderByInputExtensions: Extension[] = [orderByInputLangSupportCompartment.of(createOrderByLangSupportExtension(props.selectedQueryLanguage))]

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
                prepend-inner-icon="mdi-filter-outline"
                placeholder="Filter by"
                @update:model-value="emit('update:filterBy', $event)"
                @update="filterByInputView = $event.view"
                :additional-extensions="filterByInputExtensions"
                @execute="emit('executeQuery')"
                class="text-gray-light"
            />
        </div>

        <div class="query-input__input">
            <VSingleLineCodeMirror
                :model-value="orderBy"
                prepend-inner-icon="mdi-sort"
                placeholder="Order by"
                @update:model-value="emit('update:orderBy', $event)"
                @update="orderByInputView = $event.view"
                :additional-extensions="orderByInputExtensions"
                @execute="emit('executeQuery')"
                class="text-gray-light"
            />
        </div>

        <LabEditorDataGridDataLocaleSelector
            :selected="selectedDataLocale"
            @update:selected="emit('update:selectedDataLocale', $event)"
            :data-locales="dataLocales"
        />

        <LabEditorDataGridEntityPropertySelector
            v-model="showPropertiesSelect"
            :grid-props="gridProps"
            :property-descriptor-index="entityPropertyDescriptorIndex"
            :selected="selectedEntityPropertyKeys"
            @update:selected="emit('update:selectedEntityPropertyKeys', $event)"
            @schema-open="showPropertiesSelect = false"
        />
    </div>
</template>

<style lang="scss" scoped>
.query-input {
    width: 100%;
    height: 2.5rem;
    display: grid;
    grid-template-columns: 2.25rem 0.65fr 0.35fr 2.25rem 2.25rem;
    column-gap: 0.375rem;
    margin: 0 0.375rem;
    align-items: center;
    justify-items: stretch;

    &__input {
        display: inline-grid;
        margin: 0 0.25rem;
    }
}
</style>
