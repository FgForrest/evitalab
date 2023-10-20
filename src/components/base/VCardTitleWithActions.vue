<script setup lang="ts">
/**
 * VCardTitle component with action buttons
 */
</script>

<template>
    <VCardTitle>
        <div class="title-container">
            <span>
                <slot />
            </span>
            <div class="title-container__actions">
                <slot name="actions" />
            </div>
        </div>
    </VCardTitle>
</template>

<style lang="scss" scoped>
.title-container {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;

    &__actions {
        display: flex;
        gap: 0.5rem;
    }
}
</style>
