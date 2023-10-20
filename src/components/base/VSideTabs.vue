<script setup lang="ts">
/**
 * Pre-configured VTabs component for vertical tabs.
 */

enum Side {
    Left = 'left',
    Right = 'right'
}

const props = defineProps<{
    modelValue: any,
    side: 'left' | 'right'
}>()
const emit = defineEmits<{
    (e: 'update:modelValue', value: any): void
}>()
</script>

<template>
    <VTabs
        :model-value="modelValue"
        @update:model-value="emit('update:modelValue', $event)"
        direction="vertical"
        :class="['side-tabs', { 'side-tabs--left': side === Side.Left }, { 'side-tabs--right': side === Side.Right }]"
    >
        <slot />
    </VTabs>
</template>

<style lang="scss" scoped>
@import "@/styles/colors.scss";
.side-tabs {
    background: $primary-dark;
    width: 3rem;

    &--left {
        border-right: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
    }

    &--right {
        border-left: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
    }

    & :deep(.v-btn) {
        min-width: 3rem;
        width: 3rem;
        padding: 0 0 0 1rem !important;

        &:after {
            width: 3rem;
        }
    }
}
</style>
