<script setup lang="ts">/**
 * Warning note shown by a visualiser about its input data (e.g. properties the query did not fetch). Shared by the
 * visualiser families.
 */
import VMarkdown from '@/modules/base/component/VMarkdown.vue'

const props = defineProps<{
    note: string
}>()
</script>

<template>
    <div class="visualiser-note">
        <VIcon>mdi-alert-outline</VIcon>
        <VMarkdown :source="props.note" />
    </div>
</template>

<style lang="scss" scoped>
@use "@/styles/colors.scss" as *;

.visualiser-note {
    display: inline-grid;
    grid-template-columns: 1.5rem 1fr;
    align-items: center;
    column-gap: 0.5rem;
    margin: 0.5rem;
    color: $warning;
}
</style>
