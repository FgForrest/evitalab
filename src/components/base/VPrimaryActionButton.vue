<script setup lang="ts">
/**
 * Pre-defined button to execute queries etc.
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
        class="v-btn--variant-primary ml-3"
    >
        <VIcon>
            <slot name="prepend-icon">mdi-play-outline</slot>
        </VIcon>

        <slot />
    </VBtn>
</template>

<style lang="scss" scoped>

</style>
