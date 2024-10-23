<script setup lang="ts">
/**
 * Pre-defined button representing the main action of tab (in the tab toolbar)
 */

const props = withDefaults(defineProps<{
    prependIcon: string
    loading?: boolean,
    disabled?: boolean
}>(), {
    loading: false,
    disabled: false
})
const emit = defineEmits<{
    (e: 'click', value: any): void
}>()
</script>

<template>
    <VBtn
        :loading="loading"
        :prepend-icon="prependIcon"
        :disabled="disabled"
        density="compact"
        @click="emit('click', $event)"
        class="v-btn--variant-primary ml-2"
    >
        <slot />
    </VBtn>
</template>

<style lang="scss" scoped>

</style>
