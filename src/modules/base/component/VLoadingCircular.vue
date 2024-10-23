<script setup lang="ts">
/**
 * Pre-configured loading spinner icon
 */

const props = withDefaults(defineProps<{
    size?: number
}>(), {
    size: 24
})
</script>

<template>
    <VProgressCircular
        indeterminate
        :size="size"
        width="3"
    />
</template>

<style lang="scss" scoped>
</style>
