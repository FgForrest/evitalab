<script setup lang="ts">
/**
 * A single big-number statistic: label, value, and an optional caption explaining how to read it.
 *
 * Deliberately not `server-viewer`'s `Tile`, which is an icon-beside-content grid — a different layout for a
 * different purpose.
 */

withDefaults(defineProps<{
    label: string
    value: string
    caption?: string
    /**
     * Row-level explanation rendered as the usual neutral information tooltip.
     */
    description?: string
}>(), {
    caption: undefined,
    description: undefined
})
</script>

<template>
    <VCard variant="tonal" class="stat-tile">
        <div class="stat-tile__label text-medium-emphasis">
            <span>{{ label }}</span>
            <span v-if="description">
                <VIcon icon="mdi-information-outline" size="small" />
                <VTooltip activator="parent">
                    <span>{{ description }}</span>
                </VTooltip>
            </span>
        </div>
        <div class="stat-tile__value">{{ value }}</div>
        <div v-if="caption" class="stat-tile__caption text-disabled">{{ caption }}</div>
    </VCard>
</template>

<style lang="scss" scoped>
.stat-tile {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.75rem 1rem;
    min-width: 12rem;

    &__label {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.75rem;
    }

    &__value {
        font-size: 1.5rem;
        font-weight: 500;
        line-height: 1.2;
    }

    &__caption {
        font-size: 0.75rem;
    }
}
</style>
