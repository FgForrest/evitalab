<script setup lang="ts">
/**
 * Informative component that is displayed when there is no data or argument.
 */

const props = defineProps<{
    icon?: string,
    title?: string,
    color?: string
}>()
</script>

<template>
    <div class="missing-data-indicator text-disabled">
        <slot>
            <VIcon :color="color">{{ icon }}</VIcon>
            <span class="missing-data-indicator__title">{{ title }}</span>

            <div class="missing-data-indicator__actions">
                <slot name="actions" />
            </div>
        </slot>
    </div>
</template>

<style lang="scss" scoped>
.missing-data-indicator {
    align-self: stretch;
    flex-grow: 2;
    height: 100%;
    width: 100%;

    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    justify-content: center;

    i {
        font-size: 4rem;
    }

    &__title {
        max-width: 35rem;
        text-align: center;
    }

    &__actions {
        margin-top: 0.5rem;
        display: flex;
        justify-content: center;
        gap: 0.5rem;
    }
}
</style>
