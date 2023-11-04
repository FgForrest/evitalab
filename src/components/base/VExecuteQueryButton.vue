<script setup lang="ts">
/**
 * Pre-defined button to execute queries.
 */
const props = withDefaults(defineProps<{
    loading?: boolean
}>(), {
    loading: false
})
const emit = defineEmits<{
    (e: 'click'): void
}>()
</script>

<template>
    <VBtn
        :loading="loading"
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
