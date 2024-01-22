<script setup lang="ts">
/**
 * Selector button to switch price type (with/without tax).
 */

import { QueryPriceMode } from '@/model/evitadb'
import { UnexpectedError } from '@/model/lab'
import { mandatoryInject } from '@/helpers/reactivity'
import { gridParamsKey } from '@/model/editor/data-grid'

const priceTypes: any[] = [
    { title: 'With tax', value: QueryPriceMode.WithTax },
    { title: 'Without tax', value: QueryPriceMode.WithoutTax }
];

const props = defineProps<{
    selected: QueryPriceMode
}>()
const emit = defineEmits<{
    (e: 'update:selected', value: QueryPriceMode): void
}>()
const gridParams = mandatoryInject(gridParamsKey)

function handlePriceTypeSelect(selected: unknown[]) {
    if (selected.length > 0) {
        const priceType: QueryPriceMode = selected[0] as QueryPriceMode
        emit('update:selected', priceType)
    } else {
        throw new UnexpectedError(gridParams.dataPointer.connection, 'No price type selected!')
    }
}
</script>

<template>
    <VBtn
        icon
        density="comfortable"
    >
        <VIcon>mdi-cash-100</VIcon>

        <VTooltip activator="parent">
            Select price type
        </VTooltip>

        <VMenu activator="parent">
            <VList
                :selected="[selected]"
                :items="priceTypes"
                density="compact"
                min-width="100"
                @update:selected="handlePriceTypeSelect"
            />
        </VMenu>
    </VBtn>
</template>

<style lang="scss" scoped>

</style>
