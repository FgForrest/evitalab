<script setup lang="ts">
/**
 * Informative component that is displayed when there is no data or argument.
 */

const props = defineProps<{
    icon?: string,
    title?: string
}>()
</script>

<template>
    <div class="missing-data-indicator text-disabled">
        <slot>
            <VIcon>{{ icon }}</VIcon>
            <span>{{ title }}</span>
        </slot>
    </div>
</template>

<style lang="scss" scoped>
.missing-data-indicator {
    align-self: stretch;
    flex-grow: 2;
    height: 100%;

    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    justify-content: center;

    i {
        font-size: 4rem;
    }
}
</style>
