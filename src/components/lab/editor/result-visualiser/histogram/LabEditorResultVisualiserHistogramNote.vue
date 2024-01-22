<script setup lang="ts">/**
 * Histogram note component for displaying warning notes about input data.
 */
import VMarkdown from '@/components/base/VMarkdown.vue'

const props = defineProps<{
    note: string
}>()
</script>

<template>
    <div class="histogram-note">
        <VIcon>mdi-alert-outline</VIcon>
        <VMarkdown :source="props.note" />
    </div>
</template>

<style lang="scss" scoped>
@import "@/styles/colors.scss";

.histogram-note {
    display: inline-grid;
    grid-template-columns: 1.5rem 1fr;
    align-items: center;
    column-gap: 0.5rem;
    margin: 0.5rem;
    color: $warning;
}
</style>
