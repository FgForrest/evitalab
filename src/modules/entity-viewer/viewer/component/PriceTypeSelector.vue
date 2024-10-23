<script setup lang="ts">
/**
 * Selector button to switch price type (with/without tax).
 */

import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { QueryPriceMode } from '@/modules/entity-viewer/viewer/model/QueryPriceMode'
import { VBtn } from 'vuetify/components'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { Command } from '@/modules/keymap/model/Command'
import VActionTooltip from '@/modules/base/component/VActionTooltip.vue'

const { t } = useI18n()

const priceTypes: any[] = [
    { title: t(`entityViewer.priceTypeSelector.${QueryPriceMode.WithTax}`), value: QueryPriceMode.WithTax },
    { title: t(`entityViewer.priceTypeSelector.${QueryPriceMode.WithoutTax}`), value: QueryPriceMode.WithoutTax }
];

const props = defineProps<{
    selected: QueryPriceMode
}>()
const emit = defineEmits<{
    (e: 'update:selected', value: QueryPriceMode): void
}>()

const priceTypeButtonRef = ref<InstanceType<typeof VBtn> | undefined>()

function handlePriceTypeSelect(selected: unknown[]) {
    if (selected.length > 0) {
        const priceType: QueryPriceMode = selected[0] as QueryPriceMode
        emit('update:selected', priceType)
    } else {
        throw new UnexpectedError('No price type selected!')
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

        <VActionTooltip :command="Command.EntityViewer_ChangePriceType" />

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
