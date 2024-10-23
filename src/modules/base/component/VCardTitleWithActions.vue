<script setup lang="ts">
/**
 * VCardTitle component with action buttons
 */
</script>

<template>
    <VCardTitle>
        <div class="title-container">
            <div class="title-container__title">
                <slot />
            </div>
            <div v-if="$slots['actions']" class="title-container__actions">
                <slot name="actions" />
            </div>
        </div>
    </VCardTitle>
</template>

<style lang="scss" scoped>
.title-container {
    width: 100%;
    display: inline-grid;
    grid-template-columns: 1fr auto;
    justify-content: space-between;
    align-items: center;

    &__title {
        text-wrap: wrap;
    }

    &__actions {
        display: flex;
        gap: 0.5rem;
    }
}
</style>
