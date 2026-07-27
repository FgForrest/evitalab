<script setup lang="ts">
/**
 * Dynamic row of multi-select filters, one per representative reference attribute. Used to filter the references
 * shown in the references / reference-attribute detail. Rendered only when the reference schema has at least one
 * representative reference attribute.
 */

import type { ReferenceFilterData } from '@/modules/entity-viewer/viewer/service/EntityViewerService'

const props = defineProps<{
    filterData: ReferenceFilterData,
    modelValue: Map<string, string[]>
}>()
const emit = defineEmits<{
    (e: 'update:modelValue', value: Map<string, string[]>): void
}>()

function onChange(attributeName: string, selected: string[]): void {
    const updated: Map<string, string[]> = new Map(props.modelValue)
    updated.set(attributeName, selected ?? [])
    emit('update:modelValue', updated)
}
</script>

<template>
    <div class="reference-group-filter">
        <VAutocomplete
            v-for="[attributeName, values] in filterData"
            :key="attributeName"
            :model-value="modelValue.get(attributeName) ?? []"
            :disabled="values.length === 0"
            prepend-inner-icon="mdi-filter-variant"
            :label="attributeName"
            :items="values"
            class="reference-group-filter__select"
            clearable
            multiple
            hide-details
            @update:model-value="onChange(attributeName, $event)"
        />
    </div>
</template>

<style lang="scss" scoped>
.reference-group-filter {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;

    &__select {
        flex: 1;
        min-width: 10rem;
    }
}
</style>
