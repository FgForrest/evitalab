<script setup lang="ts">
/**
 * Pre-defined button to execute queries.
 */

const emit = defineEmits<{
    (e: 'click'): void
}>()
</script>

<template>
    <VBtn
        density="compact"
        @click="emit('click')"
        class="v-btn--variant-primary"
    >
        <VIcon>mdi-play-outline</VIcon>

        <VTooltip activator="parent">
            Execute query
        </VTooltip>
        Run
    </VBtn>
</template>

<style lang="scss" scoped>

</style>
