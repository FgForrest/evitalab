<script setup lang="ts">

const props = defineProps<{
    prependIcon: string
}>()
</script>

<template>
    <div class="status-detail-item">
        <VIcon class="status-detail-item__prepend-icon">
            {{ prependIcon }}
        </VIcon>

        <div>
            <slot name="default" />
        </div>
    </div>
</template>

<style lang="scss" scoped>
.status-detail-item {
    display: inline-grid;
    grid-template-columns: 2.25rem 1fr;
    column-gap: 1rem;
    align-items: start;

    &__prepend-icon {
        width: 2.25rem;
        height: 2.25rem;
    }
}
</style>
