<script setup lang="ts">
/**
 * Shows details of an entity property (table cell content) in the LabEditorDataGridGrid component.
 */

import CodemirrorFull from '@/components/base/CodemirrorFull.vue'
import VClosableCardTitle from '@/components/base/VClosableCardTitle.vue'
import { EntityPropertyDescriptor } from '@/model/editor/data-grid'

const props = defineProps<{
    modelValue: boolean,
    propertyDescriptor: EntityPropertyDescriptor | undefined,
    propertyValue: any
}>()
const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
}>()
</script>

<template>
    <VCard class="data-grid-cell-detail">
        <VClosableCardTitle @close="emit('update:modelValue', false)">
            {{ propertyDescriptor?.title || 'Unknown property' }}
        </VClosableCardTitle>
        <VDivider />
        <VCardText class="data-grid-cell-detail__body">
            <CodemirrorFull
                :model-value="propertyValue.toString()"
                read-only
            />
        </VCardText>
    </VCard>
</template>

<style lang="scss" scoped>
.data-grid-cell-detail {
    display: grid;
    grid-template-rows: auto auto 1fr;

    &__body {
        position: relative;
    }
}
</style>
