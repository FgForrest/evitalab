<script setup lang="ts">
/**
 * Selector button to switch price type (with/without tax).
 */

import { QueryPriceMode } from '@/model/evitadb'
import { UnexpectedError } from '@/model/lab'
import { mandatoryInject } from '@/helpers/reactivity'
import { ref } from 'vue'
import { VBtn } from 'vuetify/components'
import VActionTooltip from '@/components/base/VActionTooltip.vue'
import { Command } from '@/model/editor/keymap/Command'
import { gridPropsKey } from '@/model/editor/tab/dataGrid/data-grid'

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
const gridProps = mandatoryInject(gridPropsKey)

const priceTypeButtonRef = ref<InstanceType<typeof VBtn> | undefined>()

function handlePriceTypeSelect(selected: unknown[]) {
    if (selected.length > 0) {
        const priceType: QueryPriceMode = selected[0] as QueryPriceMode
        emit('update:selected', priceType)
    } else {
        throw new UnexpectedError(gridProps.params.dataPointer.connection, 'No price type selected!')
    }
}

function focus(): void {
    priceTypeButtonRef.value?.$el?.click()
    priceTypeButtonRef.value?.$el?.focus()
}

defineExpose<{
    focus: () => void
}>({
    focus
})
</script>

<template>
    <VBtn
        ref="priceTypeButtonRef"
        icon
        density="comfortable"
    >
        <VIcon>mdi-cash-100</VIcon>

        <VActionTooltip :command="Command.EntityGrid_ChangePriceType">
            Select price type
        </VActionTooltip>

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
