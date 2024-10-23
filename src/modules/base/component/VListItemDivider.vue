<script setup lang="ts">
/**
 * Pre-styles divider for separating list items.
 */

const props = withDefaults(defineProps<{
    inset?: boolean
}>(), {
    inset: false
})
</script>

<template>
    <VDivider :inset="inset" class="mt-2 mb-2"/>
</template>

<style lang="scss" scoped>

</style>
